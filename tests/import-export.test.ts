import { describe, expect, test } from "bun:test";
import { exportICS } from "@/lib/import-export";
import { Visibility, type Event } from "@/types/planner";

// Eigenes Event (info === null) — nur solche Events brauchen den
// Semesterzeitraum, externe Veranstaltungen bringen eigene Termine mit.
const eigenesEvent: Event = {
  id: 1,
  name: "Lerngruppe",
  shortname: "LG",
  active: Visibility.Visible,
  bgcolor: "#fff",
  textcolor: "#000",
  info: null,
  events: [
    {
      name: "Lerngruppe",
      shortname: "LG",
      active: Visibility.Visible,
      dates: [{ day: "Mi", start: "10:00", end: "12:00" }],
    },
  ],
};

/** Alle DTSTART-Datumsangaben (YYYYMMDD) aus dem ICS. */
function startDates(ics: string): string[] {
  return [...ics.matchAll(/DTSTART;TZID=Europe\/Berlin:(\d{8})/g)].map((m) => m[1]);
}

describe("exportICS mit Semesterzeitraum", () => {
  test("wiederholt eigene Events über die Vorlesungszeit des Semesters", () => {
    const ics = exportICS([eigenesEvent], {
      startDatum: "2026-05-06",
      endDatum: "2026-08-18",
    });
    const dates = startDates(ics);

    // 6.5.2026 ist ein Mittwoch, 18.8.2026 ein Dienstag — der letzte Mittwoch
    // liegt in der Woche des Semesterendes, also am 19.8.
    expect(dates[0]).toBe("20260506");
    expect(dates.at(-1)).toBe("20260819");
    expect(dates).toHaveLength(16);
  });

  test("kommt mit ISO-Zeitstempeln aus der API klar", () => {
    const ics = exportICS([eigenesEvent], {
      startDatum: "2026-05-06T00:00:00.000Z",
      endDatum: "2026-05-20T00:00:00.000Z",
    });

    expect(startDates(ics)).toEqual(["20260506", "20260513", "20260520"]);
  });

  test("ohne hinterlegten Zeitraum wird ab heute über 16 Wochen exportiert", () => {
    const ics = exportICS([eigenesEvent], null);
    const dates = startDates(ics);

    expect(dates.length).toBeGreaterThanOrEqual(16);
    expect(dates.length).toBeLessThanOrEqual(18);
  });

  test("ein fehlendes Enddatum fällt auf 16 Wochen ab Start zurück", () => {
    const ics = exportICS([eigenesEvent], { startDatum: "2026-05-06", endDatum: null });

    expect(startDates(ics)[0]).toBe("20260506");
    expect(startDates(ics).length).toBeGreaterThanOrEqual(16);
  });
});
