import { Stundenplan } from "@/hooks/use-stundenplan";
import { Event, SearchResult, Visibility } from "../types/planner";
import { DAYS } from "./planner-utils";
import { NewEventData } from "@/components/add-event-modal";

const semesterZeit = new Map([
  ["SoSe 26", [new Date(2026, 4, 6), new Date(2026, 7, 18)]],
]);

function decodeBase64(base64: string): string {
  try {
    return decodeURIComponent(escape(atob(base64)));
  } catch {
    return atob(base64);
  }
}

export function importStundeplan(
  createStundenplan: (name: string, semesterId: number) => void,
  addEvent: (eventData: NewEventData) => number | undefined,
  addSearchResult: (result: SearchResult) => number | null,
  toggleSubEvent: (eventId: number, subEventName: string) => void,
  toggleEvent: (eventId: number) => void,
  changeEventColor: (eventId: number, color: string) => void,
  params: URLSearchParams,
) {
  const importParam = params.get("import");
  if (!importParam) return;

  let name: string;
  let sem: number;
  let data: string;
  try {
    const decoded = decodeBase64(importParam);
    const payload = JSON.parse(decoded);
    name = payload.name ?? "Importierter Stundenplan";
    sem = payload.sem ?? 0;
    data = payload.data ?? "";
  } catch {
    console.error("Ungültiger Import-Parameter");
    return;
  }

  // Stundenplan Erstellen
  createStundenplan(name || "Importierter Stundenplan", sem);

  // Events hinzufügen
  if (data) {
    (async () => {
      const ownEvents: NewEventData[] = [];
      const ownEventVisibility: string[] = [];
      const searchResults: SearchResult[] = [];
      const searchResultVisibility: string[] = [];
      const searchResultColors: string[] = [];

      for (const evStr of data.split("|")) {
        if (!evStr) continue;

        if (evStr.startsWith("*")) {
          // Eigenes Event
          const [namePart, visPart, colorPart, subPart, datesPart] = evStr
            .substring(1)
            .split("-");
          // visPart[0] = Event-Visibility, visPart[1..] = SubEvent-Visibilities

          ownEvents.push({
            name: namePart,
            color: colorPart,
            groups: subPart.split(";").map((subStr, index) => ({
              name: `${subStr}`,
              dates: [
                (() => {
                  const d = datesPart.split(";")[index];
                  const [day, start, end] = d.split(",");
                  return { day, start, end };
                })(),
              ],
            })),
          });
          ownEventVisibility.push(visPart);
        } else {
          // Normales Event
          // visPart[0] = Event-Visibility, visPart[1..] = SubEvent-Visibilities
          const [idPart, visPart, colorPart] = evStr.split("-");
          const url = "/api/search?id=" + idPart;
          const response = await fetch(url);
          const result = await response.json();
          searchResults.push(result);
          searchResultVisibility.push(visPart);
          searchResultColors.push(colorPart);
        }
      }

      // Alle Events auf einmal hinzufügen
      ownEvents.forEach((e, index) => {
        const event = addEvent(e);
        if (event) {
          // Index 0 = Event-Visibility, danach SubEvent-Visibilities
          if (ownEventVisibility[index][0] === "0") toggleEvent(event);
          for (let i = 0; i < e.groups.length; i++) {
            const vis = ownEventVisibility[index][i + 1];
            if (vis === "0") toggleSubEvent(event, e.groups[i]?.name);
          }
        }
      });
      searchResults.forEach((r, index) => {
        const event = addSearchResult(r);
        if (index < searchResultColors.length && searchResultColors[index]) {
          changeEventColor(r.veranstaltung.id, searchResultColors[index]);
        }
        if (event) {
          // Index 0 = Event-Visibility, danach SubEvent-Visibilities
          if (searchResultVisibility[index]?.[0] === "0") toggleEvent(event);
          if (r.uebungsgruppen) {
            for (let i = 0; i < r.uebungsgruppen.length; i++) {
              const vis = searchResultVisibility[index]?.[i + 1];
              if (vis === "0")
                toggleSubEvent(event, r.uebungsgruppen[i].uebungsgruppe.name);
            }
          }
        }
      });
    })();
  }
}

export function createShareLink(stundenplan: Stundenplan) {
  const name = stundenplan?.name;
  const sem = stundenplan?.semesterId;
  const eventdata = stundenplan?.events
    .map((e) => {
      const eventVis = e.active === Visibility.Hidden ? "0" : "1";
      if (e.info != null) {
        return (
          e.id +
          "-" +
          eventVis +
          e.events
            .map((sub) => (sub.active === Visibility.Visible ? "1" : "0"))
            .join("") +
          "-" +
          e.bgcolor
        );
      } else {
        return (
          "*" +
          e.name +
          "-" +
          eventVis +
          e.events
            .map((sub) => (sub.active === Visibility.Visible ? "1" : "0"))
            .join("") +
          "-" +
          e.bgcolor +
          "-" +
          e.events.map((sub) => sub.name).join(";") +
          "-" +
          e.events
            .map((sub) =>
              sub.dates
                .map((d) => d.day + "," + d.start + "," + d.end)
                .join(","),
            )
            .join(";")
        );
      }
    })
    .join("|");

  const payload = JSON.stringify({
    name: name || "",
    sem,
    data: eventdata || "",
  });
  const base64 = btoa(unescape(encodeURIComponent(payload)));
  return `www.stineultras.de/?import=${encodeURIComponent(base64)}`;
}

// Kombiniert Datum aus `dateObj` und Uhrzeit aus `timeObj` zu ICS-Lokalzeit
const toICSLocalDateTime = (dateObj: Date, timeObj: Date) => {
  const d = new Date(dateObj);
  const t = new Date(timeObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(t.getUTCHours()).padStart(2, "0");
  const minutes = String(t.getUTCMinutes()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}00`;
};

// UTC-Timestamp für DTSTAMP (RFC 5545: muss UTC sein)
const toICSDTSTAMP = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");

const VTIMEZONE_BERLIN = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Berlin",
  "BEGIN:STANDARD",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "END:STANDARD",
  "BEGIN:DAYLIGHT",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "END:DAYLIGHT",
  "END:VTIMEZONE",
].join("\r\n");

// Hilfsfunktion: Montag der Woche, die `date` enthält
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay(); // 0=So, 1=Mo, ..., 6=Sa
  const daysToMonday = (dow + 6) % 7;
  d.setDate(d.getDate() - daysToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Datumsbereich aller sichtbaren externen Termine (für eigene Events)
function getExternalDateRange(
  events: Event[],
): { weekStart: Date; weekEnd: Date } | null {
  const timestamps: number[] = [];
  for (const e of events) {
    if (!e.info || e.active === Visibility.Hidden) continue;
    for (const t of e.info.termine || []) {
      timestamps.push(new Date(t.tag).getTime());
    }
    for (const ug of e.info.uebungsgruppen || []) {
      const sub = e.events.find((s) => s.name === ug.uebungsgruppe.name);
      if (sub && sub.active === Visibility.Hidden) continue;
      for (const t of ug.termine || []) {
        timestamps.push(new Date(t.tag).getTime());
      }
    }
  }
  if (timestamps.length === 0) return null;

  const weekStart = getMondayOfWeek(new Date(Math.min(...timestamps)));
  const weekEnd = getMondayOfWeek(new Date(Math.max(...timestamps)));
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const formatDatePart = (d: Date) =>
  `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;

const makeVEvent = (lines: string[]) => lines.filter(Boolean).join("\r\n");

export function exportICS(events: Event[], semester: string) {
  const dtstamp = toICSDTSTAMP(new Date());

  // Datumsbereich für eigene Events aus externen Terminen ableiten
  const externalRange = getExternalDateRange(events);
  const { weekStart, weekEnd } =
    externalRange ??
    (() => {
      const semBase = semesterZeit.get(semester)?.[0] || new Date();
      const ws = getMondayOfWeek(semBase);
      const semEnd =
        semesterZeit.get(semester)?.[1] ||
        new Date(semBase.getTime() + 1000 * 60 * 60 * 24 * 7 * 16);
      const we = getMondayOfWeek(semEnd);
      we.setDate(we.getDate() + 6);
      we.setHours(23, 59, 59, 999);
      return { weekStart: ws, weekEnd: we };
    })();

  const icsEvents = events.flatMap((e) => {
    // Komplett ausgeblendete Events überspringen
    if (e.active === Visibility.Hidden) return [];

    if (e.info) {
      // Normale Events – nur sichtbare SubEvents exportieren
      const result: string[] = [];

      // Haupttermine (wenn vorhanden und SubEvent sichtbar)
      if (e.info.termine && e.info.termine.length > 0) {
        const mainSub = e.events.find(
          (sub) => sub.name === e.info!.veranstaltung.name,
        );
        if (!mainSub || mainSub.active !== Visibility.Hidden) {
          const summary = e.icsName || e.name;
          e.info.termine.forEach((termin, index) => {
            const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}-${index}@stine-ultras`;
            result.push(
              makeVEvent([
                "BEGIN:VEVENT",
                `UID:${uid}`,
                `SUMMARY:${summary}`,
                `DTSTART;TZID=Europe/Berlin:${toICSLocalDateTime(new Date(termin.tag), new Date(termin.startZeit))}`,
                `DTEND;TZID=Europe/Berlin:${toICSLocalDateTime(new Date(termin.tag), new Date(termin.endZeit))}`,
                `DTSTAMP:${dtstamp}`,
                termin.raum ? `LOCATION:${termin.raum}` : "",
                "END:VEVENT",
              ]),
            );
          });
        }
      }

      // Übungsgruppen – SubEvent-Namen als SUMMARY, nur sichtbare
      if (e.info.uebungsgruppen) {
        for (const ug of e.info.uebungsgruppen) {
          const sub = e.events.find((s) => s.name === ug.uebungsgruppe.name);
          if (sub && sub.active === Visibility.Hidden) continue;

          const summary = sub?.icsName || ug.uebungsgruppe.name;
          (ug.termine || []).forEach((termin, index) => {
            const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}-${index}@stine-ultras`;
            result.push(
              makeVEvent([
                "BEGIN:VEVENT",
                `UID:${uid}`,
                `SUMMARY:${summary}`,
                `DTSTART;TZID=Europe/Berlin:${toICSLocalDateTime(new Date(termin.tag), new Date(termin.startZeit))}`,
                `DTEND;TZID=Europe/Berlin:${toICSLocalDateTime(new Date(termin.tag), new Date(termin.endZeit))}`,
                `DTSTAMP:${dtstamp}`,
                termin.raum ? `LOCATION:${termin.raum}` : "",
                "END:VEVENT",
              ]),
            );
          });
        }
      }

      return result;
    } else {
      // Eigene Events – wöchentlich in korrektem Datumsbereich, weekStart ist immer Montag
      const hasMultipleSubs = e.events.length > 1;

      return e.events
        .filter((sub) => sub.active !== Visibility.Hidden)
        .flatMap((sub) =>
          sub.dates.flatMap((d, index) => {
            const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}-${index}@stine-ultras`;
            const [startHour, startMinute] = d.start.split(":").map(Number);
            const [endHour, endMinute] = d.end.split(":").map(Number);
            // Mo=0, Di=1, Mi=2, Do=3, Fr=4
            const dayOffset = DAYS.indexOf(d.day);
            const summary = hasMultipleSubs
              ? sub.icsName || sub.name
              : e.icsName || e.name;

            const result: string[] = [];
            for (
              let weekMs = weekStart.getTime();
              weekMs <= weekEnd.getTime();
              weekMs += 7 * 24 * 60 * 60 * 1000
            ) {
              const targetDay = new Date(weekMs);
              targetDay.setDate(targetDay.getDate() + dayOffset);
              const dtDate = formatDatePart(targetDay);
              const dtstart = `${dtDate}T${pad2(startHour)}${pad2(startMinute)}00`;
              const dtend = `${dtDate}T${pad2(endHour)}${pad2(endMinute)}00`;

              result.push(
                makeVEvent([
                  "BEGIN:VEVENT",
                  `UID:${uid}-${dtDate}`,
                  `SUMMARY:${summary}`,
                  `DTSTART;TZID=Europe/Berlin:${dtstart}`,
                  `DTEND;TZID=Europe/Berlin:${dtend}`,
                  `DTSTAMP:${dtstamp}`,
                  d.room ? `LOCATION:${d.room}` : "",
                  "END:VEVENT",
                ]),
              );
            }
            return result;
          }),
        );
    }
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//STiNE Ultras//Stundenplan Export//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    VTIMEZONE_BERLIN,
    ...icsEvents,
    "END:VCALENDAR",
  ].join("\r\n");
}
