import { describe, expect, test } from "bun:test";
import { exportICS } from "@/lib/import-export";
import { Visibility, type Event } from "@/types/planner";

// Eigenes Event am Montagabend — der Wechsel von Sommer- auf Winterzeit fällt
// mitten in die Vorlesungszeit des Wintersemesters.
const montagsEvent: Event = {
  id: 1,
  name: "Abendtermin",
  shortname: "AB",
  active: Visibility.Visible,
  bgcolor: "#fff",
  textcolor: "#000",
  info: null,
  events: [
    {
      name: "Abendtermin",
      shortname: "AB",
      active: Visibility.Visible,
      dates: [{ day: "Mo", start: "18:00", end: "20:00" }],
    },
  ],
};

const WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

/** Wochentag zu einem DTSTART-Datum (YYYYMMDD). */
function wochentag(datum: string): string {
  const d = new Date(
    Number(datum.slice(0, 4)),
    Number(datum.slice(4, 6)) - 1,
    Number(datum.slice(6, 8)),
  );
  return WOCHENTAGE[d.getDay()];
}

function starts(ics: string): { datum: string; zeit: string }[] {
  return [
    ...ics.matchAll(/DTSTART;TZID=Europe\/Berlin:(\d{8})T(\d{6})/g),
  ].map((m) => ({ datum: m[1], zeit: m[2] }));
}

describe("exportICS über Zeitumstellungen hinweg", () => {
  test("Montagstermine bleiben nach dem Ende der Sommerzeit montags", () => {
    // Winterzeit beginnt am 26.10.2025 — Woche 3 der Vorlesungszeit.
    const ics = exportICS([montagsEvent], {
      startDatum: "2025-10-13",
      endDatum: "2026-01-31",
    });
    const termine = starts(ics);

    expect(termine.length).toBeGreaterThan(3);
    expect(termine.map((t) => wochentag(t.datum))).toEqual(
      termine.map(() => "Mo"),
    );
    expect(termine.map((t) => t.zeit)).toEqual(termine.map(() => "180000"));
    expect(termine[0].datum).toBe("20251013");
    expect(termine[2].datum).toBe("20251027");
  });

  test("Montagstermine bleiben nach dem Beginn der Sommerzeit montags", () => {
    // Sommerzeit beginnt am 29.3.2026 — mitten im Sommersemester-Raster.
    const ics = exportICS([montagsEvent], {
      startDatum: "2026-03-16",
      endDatum: "2026-04-20",
    });
    const termine = starts(ics);

    expect(termine.map((t) => wochentag(t.datum))).toEqual(
      termine.map(() => "Mo"),
    );
    expect(termine.map((t) => t.datum)).toEqual([
      "20260316",
      "20260323",
      "20260330",
      "20260406",
      "20260413",
      "20260420",
    ]);
  });
});
