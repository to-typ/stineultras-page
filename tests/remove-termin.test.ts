import { describe, expect, test } from "bun:test";
import { removeTerminFromEvent } from "@/lib/planner-utils";
import { exportICS } from "@/lib/import-export";
import { Visibility, type Event } from "@/types/planner";
import type { Termin, Uebungsgruppe, Veranstaltung } from "@prisma/client";

/**
 * Termin wie er aus der API kommt: `tag` mit Datum, `startZeit`/`endZeit`
 * als Zeit-Spalte (Prisma liefert dafür den 1.1.1970 in UTC).
 */
function termin(id: number, nummer: number, tag: string, start: string, end: string): Termin {
  return {
    id,
    nummer,
    raum: "A-123",
    tag: new Date(`${tag}T00:00:00.000Z`),
    startZeit: new Date(`1970-01-01T${start}:00.000Z`),
    endZeit: new Date(`1970-01-01T${end}:00.000Z`),
    veranstaltungsId: 1,
    uebungsId: null,
  };
}

const veranstaltung = { id: 1, name: "Diskrete Mathematik", stineName: "DM" } as Veranstaltung;

/** Veranstaltung mit eigenen Terminen (kein Übungsbetrieb). */
function eventMitTerminen(): Event {
  const termine = [
    termin(10, 1, "2026-10-13", "10:00", "12:00"), // Dienstag
    termin(11, 2, "2026-10-20", "10:00", "12:00"),
    termin(12, 3, "2026-10-24", "14:00", "16:00"), // Samstag-Zusatztermin
  ];
  return {
    id: 1,
    name: veranstaltung.name,
    shortname: "DM",
    active: Visibility.Visible,
    bgcolor: "#ffd54f",
    textcolor: "#000",
    icsName: "Mathe",
    info: { veranstaltung, termine, uebungsgruppen: null, module: null },
    events: [
      {
        name: veranstaltung.name,
        shortname: "DM",
        active: Visibility.Visible,
        dates: [
          { day: "Di", start: "10:00", end: "12:00", room: "A-123" },
          { day: "Di", start: "10:00", end: "12:00", room: "A-123" },
          { day: "Sa", start: "14:00", end: "16:00", room: "A-123" },
        ],
      },
    ],
  };
}

/** Veranstaltung mit zwei Übungsgruppen. */
function eventMitGruppen(): Event {
  const gruppe = (id: number, name: string): Uebungsgruppe => ({ id, name, veranstaltungsId: 1 });
  return {
    id: 2,
    name: "Rechnerstrukturen",
    shortname: "RSB",
    active: Visibility.Visible,
    bgcolor: "#f57c00",
    textcolor: "#fff",
    info: {
      veranstaltung: { ...veranstaltung, id: 2, name: "Rechnerstrukturen" } as Veranstaltung,
      termine: null,
      uebungsgruppen: [
        { uebungsgruppe: gruppe(1, "Gruppe 1"), termine: [termin(20, 1, "2026-10-12", "08:00", "10:00")] },
        {
          uebungsgruppe: gruppe(2, "Gruppe 2"),
          termine: [termin(21, 1, "2026-10-14", "12:00", "14:00"), termin(22, 2, "2026-10-21", "12:00", "14:00")],
        },
      ],
      module: null,
    },
    events: [
      {
        name: "Gruppe 1",
        shortname: "Gruppe 1",
        active: Visibility.Visible,
        dates: [{ day: "Mo", start: "08:00", end: "10:00", room: "A-123" }],
      },
      {
        name: "Gruppe 2",
        shortname: "Gruppe 2",
        active: Visibility.Hidden,
        dates: [
          { day: "Mi", start: "12:00", end: "14:00", room: "A-123" },
          { day: "Mi", start: "12:00", end: "14:00", room: "A-123" },
        ],
      },
    ],
  };
}

describe("removeTerminFromEvent", () => {
  test("entfernt den Termin aus den Daten und aus der Wochenansicht", () => {
    const result = removeTerminFromEvent(eventMitTerminen(), 12);

    expect(result.info!.termine!.map((t) => t.id)).toEqual([10, 11]);
    // Der Samstagstermin verschwindet auch aus den Kalendereinträgen.
    expect(result.events[0].dates).toEqual([
      { day: "Di", start: "10:00", end: "12:00", room: "A-123" },
      { day: "Di", start: "10:00", end: "12:00", room: "A-123" },
    ]);
  });

  test("lässt die übrigen wöchentlichen Termine des Slots stehen", () => {
    const result = removeTerminFromEvent(eventMitTerminen(), 10);

    expect(result.info!.termine!.map((t) => t.id)).toEqual([11, 12]);
    // Der Dienstagsblock bleibt sichtbar, nur eine Woche weniger.
    expect(result.events[0].dates.filter((d) => d.day === "Di")).toHaveLength(1);
  });

  test("trifft nur die Übungsgruppe, zu der der Termin gehört", () => {
    const result = removeTerminFromEvent(eventMitGruppen(), 21);

    expect(result.info!.uebungsgruppen![0].termine.map((t) => t.id)).toEqual([20]);
    expect(result.info!.uebungsgruppen![1].termine.map((t) => t.id)).toEqual([22]);
    expect(result.events[0].dates).toHaveLength(1);
    expect(result.events[1].dates).toHaveLength(1);
  });

  test("behält Sichtbarkeit, Farbe und Kalenderbezeichnung", () => {
    const result = removeTerminFromEvent(eventMitGruppen(), 20);

    expect(result.events[0].dates).toHaveLength(0);
    expect(result.events[1].active).toBe(Visibility.Hidden);
    expect(result.bgcolor).toBe("#f57c00");
    expect(removeTerminFromEvent(eventMitTerminen(), 10).icsName).toBe("Mathe");
  });

  test("verändert das Original nicht — nötig für Rückgängig", () => {
    const original = eventMitTerminen();
    removeTerminFromEvent(original, 12);

    expect(original.info!.termine).toHaveLength(3);
    expect(original.events[0].dates).toHaveLength(3);
  });

  test("ignoriert unbekannte IDs und eigene Events", () => {
    const unveraendert = removeTerminFromEvent(eventMitTerminen(), 999);
    expect(unveraendert.info!.termine).toHaveLength(3);

    const eigenes: Event = { ...eventMitTerminen(), info: null };
    expect(removeTerminFromEvent(eigenes, 10)).toBe(eigenes);
  });

  test("exportiert den entfernten Termin nicht mehr ins ICS", () => {
    const vorher = exportICS([eventMitTerminen()]);
    expect(vorher).toContain("DTSTART;TZID=Europe/Berlin:20261024T140000");

    const nachher = exportICS([removeTerminFromEvent(eventMitTerminen(), 12)]);
    expect(nachher).not.toContain("20261024T140000");
    expect(nachher).toContain("20261013T100000");
  });
});
