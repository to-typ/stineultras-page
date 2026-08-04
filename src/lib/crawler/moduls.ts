import { prisma } from "@/lib/prisma";
import type { CrawlContext } from "@/lib/crawler/context";
import { findOrCreateModul, linkVeranstaltungToModul } from "@/lib/crawler/db";
import { findSubmenus, findVeranstaltungen } from "@/lib/crawler/parse";

const stineBaseURL = "https://www.stine.uni-hamburg.de";

/**
 * Zweiter Crawl-Durchgang: läuft denselben Menübaum ab, legt aber nur Module
 * an und verknüpft sie mit bereits vorhandenen Veranstaltungen.
 */
export async function crawlModule(
  ctx: CrawlContext,
  url: string,
  semesterId: number,
): Promise<void> {
  await crawlMenu(ctx, "Übersicht", url, semesterId);
  await ctx.flush(true);
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

  await ctx.wait();
  ctx.trackRequest(url);
  console.log(`Crawling menu: ${url}`);

  const response = await fetch(url, { method: "GET" });
  const html = await response.text();
  ctx.trackMenu();

  if (!html.includes("auditRegistrationList") || html.includes("Veranstaltungen / Module")) {
    const modul = await findOrCreateModul(name, semesterId);

    const veranstaltungen = findVeranstaltungen(html);
    for (const veranstaltung of veranstaltungen) {
      const stineId = veranstaltung.name.split(" ")[0];

      const stineVeranstaltung = await prisma.veranstaltung.findFirst({
        where: { stineId: stineId, semesterId: semesterId },
      });
      if (stineVeranstaltung) {
        await linkVeranstaltungToModul(stineVeranstaltung.id, modul.id);
        ctx.trackVeranstaltung();
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
