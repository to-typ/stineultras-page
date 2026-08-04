import { prisma } from "@/lib/prisma";
import type { CrawlContext } from "@/lib/crawler/context";
import { findOrCreateModul, linkVeranstaltungToModul } from "@/lib/crawler/db";
import {
  findSubmenus,
  findTermine,
  findUebungsgruppen,
  findVeranstaltungen,
  getUebungsgruppeData,
  getVeranstaltungData,
} from "@/lib/crawler/parse";

const stineBaseURL = "https://www.stine.uni-hamburg.de";

/** Einstiegspunkt: crawlt den kompletten Menübaum eines Semesters. */
export async function crawlVeranstaltungen(
  ctx: CrawlContext,
  url: string,
  semesterId: number,
): Promise<void> {
  await crawlMenu(ctx, "Übersicht", url, semesterId);
  await ctx.flush(true);
}

async function fetchHtml(ctx: CrawlContext, url: string): Promise<string> {
  await ctx.wait();
  ctx.trackRequest(url);
  // Bei jedem Request flushen (intern auf 2 s gedrosselt). Sonst bliebe der
  // Herzschlag während einer langen Kursliste minutenlang aus und der Job
  // würde als verwaist abgeräumt.
  await ctx.flush();
  console.log(`Crawling: ${url}`);
  const response = await fetch(url, { method: "GET" });
  return await response.text();
}

async function crawlMenu(
  ctx: CrawlContext,
  name: string,
  url: string,
  semesterId: number,
): Promise<void> {
  if (!url) {
    console.log(`Crawling menu: null url`);
    return;
  }

  const html = await fetchHtml(ctx, url);
  ctx.trackMenu();

  if (!html.includes("auditRegistrationList") || html.includes("Veranstaltungen / Module")) {
    const veranstaltungen = findVeranstaltungen(html);
    if (veranstaltungen.length > 0) {
      const modul = await findOrCreateModul(name, semesterId);

      for (const veranstaltung of veranstaltungen) {
        const id = await crawlVeranstaltung(ctx, stineBaseURL + veranstaltung.url, semesterId);

        if (id) {
          await linkVeranstaltungToModul(id, modul.id);
        }
      }
    }
  }

  if (html.includes("auditRegistrationList")) {
    const submenuLinks = findSubmenus(html);
    ctx.enterMenu(submenuLinks.length);
    for (const submenu of submenuLinks) {
      if (await ctx.shouldStop()) {
        break;
      }
      await crawlMenu(ctx, submenu.title, stineBaseURL + submenu.href, semesterId);
      ctx.advanceMenu();
    }
    ctx.exitMenu();
  }
}

async function crawlVeranstaltung(
  ctx: CrawlContext,
  url: string,
  semesterId: number,
): Promise<number | null> {
  if (!url) {
    console.log(`Crawling event: null url`);
    return null;
  }

  const html = await fetchHtml(ctx, url);
  const eventData = getVeranstaltungData(html);

  const existing = await prisma.veranstaltung.findMany({
    where: { stineId: eventData.stineId, semesterId: semesterId },
  });
  if (existing.length > 0 && eventData.stineId) {
    return existing[0].id;
  }

  const result = await prisma.veranstaltung.create({
    data: {
      name: eventData.name,
      stineId: eventData.stineId,
      typ: eventData.type,
      stineName: eventData.stineName,
      lehrende: eventData.person,
      url: url,
      semester: { connect: { id: semesterId } },
    },
  });
  ctx.trackVeranstaltung();

  if (html.includes("Kleingruppe(n)")) {
    const subgroups = findUebungsgruppen(html);
    for (const subgroup of subgroups) {
      await crawlUebungsgruppe(ctx, stineBaseURL + subgroup.href, result.id);
    }
  } else {
    await crawlTermin(ctx, html, undefined, result.id);
  }
  return result.id;
}

async function crawlUebungsgruppe(ctx: CrawlContext, url: string, eventId: number): Promise<void> {
  if (!url) {
    return;
  }

  const html = await fetchHtml(ctx, url);
  const uebungsgruppeData = getUebungsgruppeData(html);
  const subgroup = await prisma.uebungsgruppe.create({
    data: {
      name: uebungsgruppeData.name,
      veranstaltung: { connect: { id: eventId } },
    },
  });
  ctx.trackUebungsgruppe();
  await crawlTermin(ctx, html, subgroup.id, undefined);
}

async function crawlTermin(
  ctx: CrawlContext,
  html: string,
  subgroupId?: number,
  eventId?: number,
): Promise<void> {
  const dates = findTermine(html);
  for (const date of dates) {
    // Behandle die Zeiten als UTC (ohne Timezone-Konvertierung)
    // da STiNE Berliner Zeit anzeigt und wir die direkt speichern wollen
    const tagDate = new Date(date.date + "T" + date.starttime + "Z");
    const startZeit = new Date(date.date + "T" + date.starttime + "Z");
    const endZeit = new Date(date.date + "T" + date.endtime + "Z");

    if (subgroupId === undefined && eventId !== undefined) {
      await prisma.termin.create({
        data: {
          tag: tagDate,
          veranstaltung: { connect: { id: eventId } },
          nummer: date.number,
          raum: date.location,
          startZeit: startZeit,
          endZeit: endZeit,
        },
      });
    } else if (subgroupId !== undefined) {
      await prisma.termin.create({
        data: {
          tag: tagDate,
          uebung: { connect: { id: subgroupId } },
          nummer: date.number,
          raum: date.location,
          startZeit: startZeit,
          endZeit: endZeit,
        },
      });
    }
  }
  ctx.trackTermine(dates.length);
}
