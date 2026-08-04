import { describe, expect, test } from "bun:test";
import { VeranstaltungsTyp } from "@prisma/client";
import { mapVeranstaltungsTyp } from "@/lib/crawler/veranstaltungs-typ";

describe("mapVeranstaltungsTyp", () => {
  test("bildet bekannte STiNE-Bezeichnungen auf das Enum ab", () => {
    expect(mapVeranstaltungsTyp("Vorlesung")).toBe(VeranstaltungsTyp.VORLESUNG);
    expect(mapVeranstaltungsTyp("Proseminar")).toBe(VeranstaltungsTyp.PROSEMINAR);
    expect(mapVeranstaltungsTyp("Übung")).toBe(VeranstaltungsTyp.UEBUNG);
    expect(mapVeranstaltungsTyp("Vorlesung + Übung")).toBe(VeranstaltungsTyp.VORLESUNG_UEBUNG);
  });

  test("liefert UNDEFINED für Unbekanntes", () => {
    expect(mapVeranstaltungsTyp("Gibt es nicht")).toBe(VeranstaltungsTyp.UNDEFINED);
    expect(mapVeranstaltungsTyp("")).toBe(VeranstaltungsTyp.UNDEFINED);
  });
});
