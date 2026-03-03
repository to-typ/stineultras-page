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
          for (let i = 0; i < e.groups.length; i++) {
            const vis = ownEventVisibility[index][i];
            if (vis === "0") toggleSubEvent(event, e.groups[i]?.name);
          }
        }
      });
      searchResults.forEach((r, index) => {
        const event = addSearchResult(r);
        if (index < searchResultColors.length && searchResultColors[index]) {
          changeEventColor(r.veranstaltung.id, searchResultColors[index]);
        }
        if (event && r.uebungsgruppen) {
          for (let i = 0; i < r.uebungsgruppen.length; i++) {
            const vis = searchResultVisibility[index][i];
            if (vis === "0")
              toggleSubEvent(event, r.uebungsgruppen[i].uebungsgruppe.name);
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
      if (e.info != null) {
        return (
          e.id +
          "-" +
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
  return `www.stineultras.de?import=${encodeURIComponent(base64)}`;
}

// Kombiniert Datum aus `dateObj` und Uhrzeit aus `timeObj` zu ICS-Lokalzeit
const toICSLocalDateTime = (dateObj: Date, timeObj: Date) => {
  const d = new Date(dateObj);
  const t = new Date(timeObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(t.getHours()).padStart(2, "0");
  const minutes = String(t.getMinutes()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}00`;
};

// Nur Datum + Uhrzeit aus demselben Date-Objekt
const toICSLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}00`;
};

// UTC-Timestamp für DTSTAMP (RFC 5545: muss UTC sein)
const toICSDTSTAMP = (date: Date) =>
  date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

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

const makeVEvent = (lines: string[]) =>
  lines.filter(Boolean).join("\r\n");

export function exportICS(events: Event[], semester: string) {
  const dtstamp = toICSDTSTAMP(new Date());

  const icsEvents = events
    .flatMap((e) => {
      if (e.info) {
        // Normale Events
        const allTermine = [
          ...(e.info.termine || []),
          ...(e.info.uebungsgruppen?.flatMap((ug) => ug.termine || []) || []),
        ];

        return allTermine.map((termin, index) => {
          const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}-${index}@stine-ultras`;
          return makeVEvent([
            "BEGIN:VEVENT",
            `UID:${uid}`,
            `SUMMARY:${e.name}`,
            `DTSTART;TZID=Europe/Berlin:${toICSLocalDateTime(new Date(termin.tag), new Date(termin.startZeit))}`,
            `DTEND;TZID=Europe/Berlin:${toICSLocalDateTime(new Date(termin.tag), new Date(termin.endZeit))}`,
            `DTSTAMP:${dtstamp}`,
            termin.raum ? `LOCATION:${termin.raum}` : "",
            "END:VEVENT",
          ]);
        });
      } else {
        // Eigene Events
        const semStartBase = semesterZeit.get(semester)?.[0] || new Date();
        const semesterEnd =
          semesterZeit.get(semester)?.[1] ||
          new Date(semStartBase.getTime() + 1000 * 60 * 60 * 24 * 7 * 16);

        return e.events.flatMap((sub) =>
          sub.dates.flatMap((d, index) => {
            const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}-${index}@stine-ultras`;
            const [startHour, startMinute] = d.start.split(":").map(Number);
            const [endHour, endMinute] = d.end.split(":").map(Number);
            const dayOffset = DAYS.indexOf(d.day);

            const result = [];
            // Kopie damit semStartBase nicht mutiert wird
            for (
              let date = new Date(semStartBase);
              date <= semesterEnd;
              date = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000)
            ) {
              const startTime = new Date(date);
              startTime.setDate(startTime.getDate() + dayOffset);
              startTime.setHours(startHour, startMinute, 0, 0);

              const endTime = new Date(date);
              endTime.setDate(endTime.getDate() + dayOffset);
              endTime.setHours(endHour, endMinute, 0, 0);

              result.push(
                makeVEvent([
                  "BEGIN:VEVENT",
                  `UID:${uid}-${startTime.getTime()}`,
                  `SUMMARY:${e.name} - ${sub.name}`,
                  `DTSTART;TZID=Europe/Berlin:${toICSLocalDate(startTime)}`,
                  `DTEND;TZID=Europe/Berlin:${toICSLocalDate(endTime)}`,
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
