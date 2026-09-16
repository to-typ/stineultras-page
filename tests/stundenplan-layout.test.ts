import { describe, expect, test } from "bun:test";
import { blockText, buildPlanGrid, rowLabel } from "@/lib/stundenplan-layout";
import { Visibility, type Event, type SearchResult, type SubEvent } from "@/types/planner";

type DateSpec = { day: string; start: string; end: string };

function sub(name: string, dates: DateSpec[], active = Visibility.Visible): SubEvent {
  return { name, shortname: name, active, dates };
}

/** Veranstaltung aus STiNE — `info` unterscheidet sie von eigenen Events. */
function stineEvent(shortname: string, subs: SubEvent[], active = Visibility.Visible): Event {
  return {
    id: 1,
    name: shortname,
    shortname,
    active,
    bgcolor: "#fff",
    textcolor: "#000",
    info: {} as SearchResult,
    events: subs,
  };
}

function eigenesEvent(shortname: string, subs: SubEvent[]): Event {
  return {
    id: 2,
    name: shortname,
    shortname,
    active: Visibility.Visible,
    bgcolor: "#fff",
    textcolor: "#000",
    info: null,
    events: subs,
  };
}

const blocksOf = (events: Event[], day: string) => buildPlanGrid(events).days.find((d) => d.day === day)!.blocks;

describe("buildPlanGrid", () => {
  test("bildet das Standardraster 8-18 Uhr ab", () => {
    const grid = buildPlanGrid([]);
    expect(grid.startHour).toBe(8);
    expect(grid.endHour).toBe(18);
    expect(rowLabel(grid, 0)).toBe("8-9");
    expect(rowLabel(grid, 9)).toBe("17-18");
  });

  test("erweitert das Raster für Termine vor 8 und nach 18 Uhr", () => {
    const grid = buildPlanGrid([
      eigenesEvent("Frühsport", [sub("Frühsport", [{ day: "Mo", start: "06:30", end: "07:30" }])]),
      eigenesEvent("Abendkurs", [sub("Abendkurs", [{ day: "Fr", start: "18:00", end: "19:30" }])]),
    ]);
    expect(grid.startHour).toBe(6);
    expect(grid.endHour).toBe(20);
  });

  test("dehnt angebrochene Stunden auf volle Zeilen aus", () => {
    // 10:15-11:45 füllt in der Vorlage die Zeilen 10-11 und 11-12.
    const [block] = blocksOf([eigenesEvent("DM", [sub("DM", [{ day: "Do", start: "10:15", end: "11:45" }])])], "Do");
    expect(block.rowStart).toBe(2);
    expect(block.rowEnd).toBe(4);
    expect(block.lanes).toBe(1);
  });

  test("fasst parallele Übungsgruppen zu einem Block mit Anzahl zusammen", () => {
    const blocks = blocksOf(
      [
        stineEvent("DM-Ü", [
          sub("Gruppe 1", [{ day: "Fr", start: "14:00", end: "16:00" }]),
          sub("Gruppe 2", [{ day: "Fr", start: "14:00", end: "16:00" }]),
          sub("Gruppe 3", [{ day: "Fr", start: "10:00", end: "11:00" }]),
        ]),
      ],
      "Fr",
    );

    const parallel = blocks.find((b) => b.rowStart === 6)!;
    expect(blockText(parallel)).toBe("DM-Ü (2)");
    expect(parallel.muted).toBe(true);
    expect(blockText(blocks.find((b) => b.rowStart === 2)!)).toBe("DM-Ü");
  });

  test("zählt wöchentliche Wiederholungen derselben Gruppe nicht doppelt", () => {
    const [block] = blocksOf(
      [
        stineEvent("RSB", [
          sub("Vorlesung", [
            { day: "Mi", start: "16:00", end: "18:00" },
            { day: "Mi", start: "16:00", end: "18:00" },
          ]),
        ]),
      ],
      "Mi",
    );
    expect(block.count).toBe(1);
    expect(block.muted).toBe(false);
    expect(blockText(block)).toBe("Vorlesung");
  });

  test("stellt überlappende Termine nebeneinander", () => {
    const blocks = blocksOf(
      [
        eigenesEvent("SE1-Ü", [sub("SE1-Ü", [{ day: "Di", start: "10:00", end: "12:00" }])]),
        stineEvent("RSB-Ü", [
          sub("Gruppe 1", [{ day: "Di", start: "10:00", end: "11:00" }]),
          sub("Gruppe 2", [{ day: "Di", start: "11:00", end: "12:00" }]),
        ]),
      ],
      "Di",
    );

    expect(blocks.every((b) => b.lanes === 2)).toBe(true);
    const lanes = blocks.map((b) => b.lane).sort();
    expect(lanes).toEqual([0, 1, 1]);
  });

  test("teilt die Spalte nur dort, wo Termine wirklich kollidieren", () => {
    const blocks = blocksOf(
      [
        eigenesEvent("A", [sub("A", [{ day: "Mo", start: "08:00", end: "10:00" }])]),
        eigenesEvent("B", [sub("B", [{ day: "Mo", start: "09:00", end: "11:00" }])]),
        eigenesEvent("C", [sub("C", [{ day: "Mo", start: "14:00", end: "16:00" }])]),
      ],
      "Mo",
    );

    const c = blocks.find((b) => b.label === "C")!;
    expect(c.lanes).toBe(1);
    expect(blocks.find((b) => b.label === "A")!.lanes).toBe(2);
    expect(blocks.find((b) => b.label === "B")!.lane).toBe(1);
  });

  test("überspringt ausgeblendete Events und Gruppen", () => {
    const grid = buildPlanGrid([
      stineEvent("Versteckt", [sub("Gruppe 1", [{ day: "Mo", start: "08:00", end: "10:00" }])], Visibility.Hidden),
      stineEvent("Teilweise", [
        sub("Gruppe 1", [{ day: "Di", start: "08:00", end: "10:00" }], Visibility.Hidden),
        sub("Gruppe 2", [{ day: "Di", start: "10:00", end: "12:00" }]),
      ]),
    ]);

    expect(grid.days.find((d) => d.day === "Mo")!.blocks).toHaveLength(0);
    const di = grid.days.find((d) => d.day === "Di")!.blocks;
    expect(di).toHaveLength(1);
    // Nur noch eine sichtbare Gruppe: fester Termin, deshalb schwarz und ohne Anzahl.
    expect(di[0].muted).toBe(false);
    expect(blockText(di[0])).toBe("Gruppe 2");
  });
});
