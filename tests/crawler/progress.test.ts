import { describe, expect, test } from "bun:test";
import { computeProgress } from "@/lib/crawler/progress";

describe("computeProgress", () => {
  test("liefert 0 ohne Frames", () => {
    expect(computeProgress([])).toBe(0);
  });

  test("nutzt auf oberster Ebene den reinen Indexanteil", () => {
    expect(computeProgress([{ index: 3, total: 12 }])).toBeCloseTo(0.25, 10);
  });

  test("gewichtet tiefere Ebenen mit dem Kehrwert der Elterngrößen", () => {
    // 2 von 12 Wurzelknoten fertig, im dritten 6 von 20 erledigt
    const p = computeProgress([
      { index: 2, total: 12 },
      { index: 6, total: 20 },
    ]);
    expect(p).toBeCloseTo(2 / 12 + (1 / 12) * (6 / 20), 10);
  });

  test("überspringt Frames ohne Kinder, statt durch null zu teilen", () => {
    const p = computeProgress([
      { index: 1, total: 2 },
      { index: 0, total: 0 },
      { index: 1, total: 4 },
    ]);
    expect(p).toBeCloseTo(0.5 + 0.5 * 0.25, 10);
  });

  test("bleibt zwischen 0 und 1, auch wenn der Index den Umfang übersteigt", () => {
    expect(computeProgress([{ index: 99, total: 12 }])).toBe(1);
  });
});
