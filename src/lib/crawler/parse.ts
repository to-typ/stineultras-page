import { VeranstaltungsTyp } from "@prisma/client";
import { mapVeranstaltungsTyp } from "@/lib/crawler/veranstaltungs-typ";

export function findSubmenus(html: string): Array<{ title: string; href: string }> {
  const links: Array<{ title: string; href: string }> = [];
  const listMatch = html.match(/<ul class="auditRegistrationList"[^>]*>([\s\S]*?)<\/ul>/);

  if (!listMatch) {
    return links;
  }

  const listContent = listMatch[1];
  const linkRegex = /<a class="auditRegNodeLink" href="([^"]*)"[^>]*>\s*([^<]*)\s*<\/a>/g;

  let match;
  while ((match = linkRegex.exec(listContent)) !== null) {
    const href = match[1].replace(/&amp;/g, "&");
    const title = match[2].trim();
    links.push({
      title: title,
      href: href,
    });
  }
  return links;
}

export function findVeranstaltungen(html: string): Array<{ name: string; url: string }> {
  const events: Array<{ name: string; url: string }> = [];
  const eventRegex = /<a name="eventLink"\s+href="([^"]*)"[^>]*>\s*([^<]*)\s*<\/a>/g;

  let match;
  while ((match = eventRegex.exec(html)) !== null) {
    const url = match[1].replace(/&amp;/g, "&");
    const name = match[2].trim();

    events.push({
      name: name,
      url: url,
    });
  }
  return events;
}

export function findTermine(html: string): Array<{
  date: string;
  starttime: string;
  endtime: string;
  location: string;
  number: number;
}> {
  const dates: Array<{
    date: string;
    starttime: string;
    endtime: string;
    location: string;
    number: number;
  }> = [];
  const dateRegex = /<div class="courseListCell[^"]*"[^>]*title="([^"]*)"[^>]*>\s*<span[^>]*>([^<]*)<span/g;

  let match;
  while ((match = dateRegex.exec(html)) !== null) {
    const titleContent = match[1];
    const number = parseInt(match[2].trim(), 10);

    const parts = titleContent.split(" / ");

    const monthMap: { [key: string]: string } = {
      Jan: "01",
      Feb: "02",
      Mär: "03",
      Apr: "04",
      Mai: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Okt: "10",
      Nov: "11",
      Dez: "12",
    };
    const datePart = parts[0]
      .replace(/^[A-Za-z]+,\s*/, "")
      .replaceAll(".", "")
      .replaceAll("*", "")
      .trim()
      .split(" ");
    const day = datePart[0].padStart(2, "0");
    const month = monthMap[datePart[1]];
    const year = datePart[2];
    const dbDate = `${year}-${month}-${day}`;

    const time = parts[1].trim();
    const starttime = time.split("-")[0].trim();
    const endtime = time.split("-")[1].trim();

    if (parts.length >= 3) {
      dates.push({
        date: dbDate,
        starttime: starttime,
        endtime: endtime,
        location: parts[2].trim(),
        number: number,
      });
    }
  }
  return dates;
}

export function findUebungsgruppen(html: string): Array<{ name: string; href: string }> {
  const subgroups: Array<{ name: string; href: string }> = [];

  const kleingruppenRegex = /<ul class="dl-ul-listview[^"]*"[^>]*>([\s\S]*?)<\/ul>/g;
  const sectionMatch = kleingruppenRegex.exec(html);

  if (!sectionMatch) {
    return subgroups;
  }

  const listContent = sectionMatch[1];

  const groupRegex = /<p class="dl-ul-li-headline"><strong>(.*?)<\/strong><\/p>/g;
  let match;

  while ((match = groupRegex.exec(listContent)) !== null) {
    const name = match[1].trim();

    const afterGroupName = listContent.substring(match.index);
    const linkMatch = afterGroupName.match(/<a href="([^"]*)"[^>]*>\s*Kleingruppe anzeigen\s*<\/a>/);

    const href = linkMatch ? linkMatch[1].replace(/&amp;/g, "&") : "";

    subgroups.push({
      name: name,
      href: href,
    });
  }

  return subgroups;
}

export function getUebungsgruppeData(html: string): { name: string } {
  const nameRegex = /<h2[^>]*>\s*Kleingruppe:\s*([^<]+?)\s*<\/h2>/;
  const nameMatch = nameRegex.exec(html);
  if (nameMatch) {
    return {
      name: nameMatch[1].trim(),
    };
  }
  return { name: "" };
}

export function getVeranstaltungData(html: string): {
  type: VeranstaltungsTyp;
  stineId: string;
  name: string;
  stineName: string;
  person: string;
} {
  const typeRegex = /Veranstaltungsart:[\s\S]*?<div[^>]*>\s*([^\n<]+)/;
  const nameRegex = /<h1[^>]*>\s*([\d-\.\w]+)[\s\S]+?(.*?)\s*<\/h1>/;
  const personRegex = /<span[^>]*id="dozenten"[^>]*>([^<]*)<\/span>/;
  const stineNameRegex = /Anzeige im Stundenplan: [\s\S]*?<div[^>]*>\s*([^\n<]+)/;
  const typeMatch = typeRegex.exec(html);
  const nameMatch = nameRegex.exec(html);
  const personMatch = personRegex.exec(html);
  const stineNameMatch = stineNameRegex.exec(html);

  const type = typeMatch ? mapVeranstaltungsTyp(typeMatch[1].trim()) : VeranstaltungsTyp.UNDEFINED;

  let stineId = "";
  let name = "";
  if (nameMatch) {
    stineId = nameMatch[1].trim();
    name = nameMatch[2].trim();
  }

  let person = "";
  if (personMatch) {
    person = personMatch[1].trim();
  }

  let stineName = "";
  if (stineNameMatch) {
    stineName = stineNameMatch[1].trim();
  }

  return {
    type: type,
    stineId: stineId,
    name: name,
    stineName: stineName,
    person: person,
  };
}
