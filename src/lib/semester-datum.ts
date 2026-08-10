/**
 * Der Vorlesungszeitraum eines Semesters ist ein reines Datum (`@db.Date`).
 * In der DB und im JSON liegt es als UTC-Mitternacht, im Browser wird daraus
 * ein lokales Datum gemacht — sonst rutscht der Export in Zeitzonen westlich
 * von UTC auf den Vortag.
 */

const ISO_DATUM = /^(\d{4})-(\d{2})-(\d{2})/;

/** „2026-05-06“ für Formulare und API-Antworten. */
export function toDatumString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    return ISO_DATUM.test(value) ? value.slice(0, 10) : null;
  }
  return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
}

/**
 * Formulareingabe → DB-Wert. `null` heißt „kein Datum hinterlegt“,
 * `undefined` signalisiert eine ungültige Eingabe.
 */
export function parseDatumInput(value: unknown): Date | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return undefined;

  const match = ISO_DATUM.exec(value.trim());
  if (!match) return undefined;

  const date = new Date(`${match[0]}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * Prüft einen Zeitraum, wie ihn `parseDatumInput` liefert. Gibt die
 * Fehlermeldung für die API zurück oder `null`, wenn alles passt.
 */
export function validateZeitraum(
  start: Date | null | undefined,
  end: Date | null | undefined,
): string | null {
  if (start === undefined || end === undefined) {
    return "Datum muss im Format JJJJ-MM-TT angegeben werden.";
  }
  if (start && end && start.getTime() > end.getTime()) {
    return "Der Semesterstart muss vor dem Semesterende liegen.";
  }
  return null;
}

/** UTC-Datum → lokale Mitternacht, damit Wochenberechnungen nicht verrutschen. */
export function toLocalDate(value: Date | string | null | undefined): Date | null {
  const iso = toDatumString(value);
  if (!iso) return null;

  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}
