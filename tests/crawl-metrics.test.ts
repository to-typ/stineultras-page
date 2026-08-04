import { describe, expect, test } from "bun:test";
import { estimateEtaMs, formatDuration, formatEta, ratesPerMinute } from "@/lib/crawl-metrics";

const MIN = 60000;

describe("ratesPerMinute", () => {
  test("bildet Differenzen zwischen aufeinanderfolgenden Samples", () => {
    const rates = ratesPerMinute([
      { t: 0, r: 0, v: 0, d: 0, p: 0 },
      { t: MIN, r: 40, v: 10, d: 30, p: 0.1 },
      { t: 2 * MIN, r: 100, v: 25, d: 80, p: 0.2 },
    ]);

    expect(rates).toEqual([
      { t: MIN, veranstaltungen: 10, requests: 40 },
      { t: 2 * MIN, veranstaltungen: 15, requests: 60 },
    ]);
  });

  test("skaliert auf eine Minute hoch, wenn der Abstand kleiner ist", () => {
    const rates = ratesPerMinute([
      { t: 0, r: 0, v: 0, d: 0, p: 0 },
      { t: MIN / 2, r: 10, v: 5, d: 0, p: 0.01 },
    ]);

    expect(rates).toEqual([{ t: MIN / 2, veranstaltungen: 10, requests: 20 }]);
  });

  test("liefert nichts bei weniger als zwei Samples", () => {
    expect(ratesPerMinute([])).toEqual([]);
    expect(ratesPerMinute([{ t: 0, r: 0, v: 0, d: 0, p: 0 }])).toEqual([]);
  });

  test("überspringt Samples mit identischem Zeitstempel", () => {
    const rates = ratesPerMinute([
      { t: MIN, r: 10, v: 5, d: 0, p: 0.1 },
      { t: MIN, r: 20, v: 9, d: 0, p: 0.1 },
    ]);
    expect(rates).toEqual([]);
  });
});

describe("estimateEtaMs", () => {
  test("extrapoliert aus dem Fortschritt, wenn er tragfähig ist", () => {
    const eta = estimateEtaMs({
      elapsedMs: 10 * MIN,
      progress: 0.5,
      requests: 500,
      samples: [],
      expectedRequests: null,
    });
    expect(eta).toBeCloseTo(10 * MIN, -2);
  });

  test("nutzt in der Anfangsphase die Request-Prognose des Vorlaufs", () => {
    // 100 Requests in 10 Minuten = 6 s pro Request, 900 fehlen noch
    const eta = estimateEtaMs({
      elapsedMs: 10 * MIN,
      progress: 0.005,
      requests: 100,
      samples: [],
      expectedRequests: 1000,
    });
    expect(eta).toBeCloseTo(900 * 6000, -2);
  });

  test("liefert null in der Anfangsphase ohne Vorlaufdaten", () => {
    expect(
      estimateEtaMs({
        elapsedMs: MIN,
        progress: 0.005,
        requests: 10,
        samples: [],
        expectedRequests: null,
      }),
    ).toBeNull();
  });

  test("blendet zwischen Prognose und Baumschätzung über", () => {
    const blended = estimateEtaMs({
      elapsedMs: 10 * MIN,
      progress: 0.035, // Mitte zwischen 0,02 und 0,05 -> Gewicht 0,5
      requests: 100,
      samples: [],
      expectedRequests: 1000,
    });

    const prior = 900 * 6000;
    const tree = (10 * MIN * (1 - 0.035)) / 0.035;
    expect(blended).toBeCloseTo(prior * 0.5 + tree * 0.5, -2);
  });

  test("verwirft die Prognose, wenn der Lauf sie bereits überholt hat", () => {
    const eta = estimateEtaMs({
      elapsedMs: 10 * MIN,
      progress: 0.005,
      requests: 2000,
      samples: [],
      expectedRequests: 1000,
    });
    expect(eta).toBeCloseTo((10 * MIN * (1 - 0.005)) / 0.005, -2);
  });

  test("glättet über die letzten Samples", () => {
    // Zwei ältere Samples sahen jeweils 20 Minuten Gesamtlaufzeit voraus,
    // der aktuelle Punkt ebenfalls -> Ergebnis bleibt bei 10 Minuten Rest.
    const eta = estimateEtaMs({
      elapsedMs: 10 * MIN,
      progress: 0.5,
      requests: 500,
      samples: [
        { t: 4 * MIN, r: 200, v: 40, d: 100, p: 0.2 },
        { t: 6 * MIN, r: 300, v: 60, d: 160, p: 0.3 },
      ],
      expectedRequests: null,
    });
    expect(eta).toBeCloseTo(10 * MIN, -3);
  });

  test("liefert null ohne Fortschritt und ohne Prognose", () => {
    expect(
      estimateEtaMs({
        elapsedMs: MIN,
        progress: 0,
        requests: 0,
        samples: [],
        expectedRequests: null,
      }),
    ).toBeNull();
  });
});

describe("formatDuration", () => {
  test("formatiert Sekunden, Minuten und Stunden", () => {
    expect(formatDuration(45000)).toBe("45 s");
    expect(formatDuration(5 * MIN)).toBe("5 min");
    expect(formatDuration(95 * MIN)).toBe("1 h 35 min");
    expect(formatDuration(120 * MIN)).toBe("2 h");
  });
});

describe("formatEta", () => {
  test("rundet grob und benennt Unbekanntes", () => {
    expect(formatEta(null)).toBe("wird ermittelt");
    expect(formatEta(30000)).toBe("unter 1 Minute");
    expect(formatEta(8 * MIN)).toBe("noch ca. 10 min");
    expect(formatEta(134 * MIN)).toBe("noch ca. 2 h 15 min");
  });
});
