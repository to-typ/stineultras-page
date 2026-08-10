import { describe, expect, test } from "bun:test";
import {
  parseDatumInput,
  toDatumString,
  toLocalDate,
  validateZeitraum,
} from "@/lib/semester-datum";

describe("toDatumString", () => {
  test("schneidet die Uhrzeit von DB-Werten ab", () => {
    expect(toDatumString(new Date("2026-05-06T00:00:00.000Z"))).toBe("2026-05-06");
    expect(toDatumString("2026-05-06T00:00:00.000Z")).toBe("2026-05-06");
  });

  test("leere und ungültige Werte werden zu null", () => {
    expect(toDatumString(null)).toBeNull();
    expect(toDatumString("")).toBeNull();
    expect(toDatumString("06.05.2026")).toBeNull();
  });
});

describe("parseDatumInput", () => {
  test("Formulareingabe wird zu UTC-Mitternacht", () => {
    expect(parseDatumInput("2026-05-06")?.toISOString()).toBe("2026-05-06T00:00:00.000Z");
  });

  test("leere Eingabe heißt „kein Datum“", () => {
    expect(parseDatumInput("")).toBeNull();
    expect(parseDatumInput(null)).toBeNull();
    expect(parseDatumInput(undefined)).toBeNull();
  });

  test("ungültige Eingabe wird als undefined gemeldet", () => {
    expect(parseDatumInput("06.05.2026")).toBeUndefined();
    expect(parseDatumInput("2026-13-40")).toBeUndefined();
    expect(parseDatumInput(20260506)).toBeUndefined();
  });
});

describe("validateZeitraum", () => {
  test("akzeptiert leere und korrekt sortierte Zeiträume", () => {
    expect(validateZeitraum(null, null)).toBeNull();
    expect(validateZeitraum(parseDatumInput("2026-05-06"), null)).toBeNull();
    expect(
      validateZeitraum(parseDatumInput("2026-05-06"), parseDatumInput("2026-08-18")),
    ).toBeNull();
  });

  test("lehnt vertauschte Grenzen ab", () => {
    expect(
      validateZeitraum(parseDatumInput("2026-08-18"), parseDatumInput("2026-05-06")),
    ).toContain("vor dem Semesterende");
  });

  test("lehnt ungültige Eingaben ab", () => {
    expect(validateZeitraum(parseDatumInput("Montag"), null)).toContain("JJJJ-MM-TT");
  });
});

describe("toLocalDate", () => {
  test("liefert lokale Mitternacht statt UTC", () => {
    const date = toLocalDate("2026-05-06T00:00:00.000Z")!;
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(4);
    expect(date.getDate()).toBe(6);
    expect(date.getHours()).toBe(0);
  });
});
