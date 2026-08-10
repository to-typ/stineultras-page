/**
 * Semester werden vom Admin frei benannt („WiSe 25/26“, „SoSe 26“, …), die
 * Datenbank kennt also keine chronologische Reihenfolge — die ID sagt nur
 * etwas über die Anlage-Reihenfolge aus. Deshalb wird hier aus dem Namen ein
 * Sortierschlüssel abgeleitet:
 *
 *   WiSe 25/26 < SoSe 26 < WiSe 26/27 < SoSe 27 < …
 */

export type SemesterLike = { id?: number; name: string };

/**
 * Chronologischer Schlüssel: Startjahr * 2, Wintersemester liegt hinter dem
 * Sommersemester desselben Jahres. Namen ohne erkennbares Semester bekommen
 * `null` und landen beim Sortieren am Ende.
 */
export function semesterSortKey(name: string): number | null {
  const normalized = name.trim().toLowerCase();

  const isWinter = /(^|\W)(wi(se)?|winter)/.test(normalized);
  const isSummer = /(^|\W)(so(se|mo)?|sommer)/.test(normalized);
  if (!isWinter && !isSummer) return null;

  // Erstes Jahr im Namen: „WiSe 25/26“ → 25, „SoSe 2026“ → 2026.
  const yearMatch = normalized.match(/\d{2,4}/);
  if (!yearMatch) return null;

  let year = parseInt(yearMatch[0], 10);
  if (yearMatch[0].length <= 2) year += 2000;
  else if (yearMatch[0].length === 3) return null;

  return year * 2 + (isWinter ? 1 : 0);
}

/** Aufsteigend: ältestes Semester zuerst. */
export function compareSemesterAsc(a: SemesterLike, b: SemesterLike): number {
  const keyA = semesterSortKey(a.name);
  const keyB = semesterSortKey(b.name);

  if (keyA === null && keyB === null) {
    return a.name.localeCompare(b.name, "de");
  }
  // Unbekannte Namen immer ans Ende, egal in welche Richtung sortiert wird.
  if (keyA === null) return 1;
  if (keyB === null) return -1;

  if (keyA !== keyB) return keyA - keyB;
  return a.name.localeCompare(b.name, "de");
}

/** Absteigend: neuestes Semester zuerst. */
export function compareSemesterDesc(a: SemesterLike, b: SemesterLike): number {
  const keyA = semesterSortKey(a.name);
  const keyB = semesterSortKey(b.name);

  if (keyA === null || keyB === null) return compareSemesterAsc(a, b);
  return compareSemesterAsc(b, a);
}

export function sortSemestersAsc<T extends SemesterLike>(semesters: T[]): T[] {
  return [...semesters].sort(compareSemesterAsc);
}

export function sortSemestersDesc<T extends SemesterLike>(semesters: T[]): T[] {
  return [...semesters].sort(compareSemesterDesc);
}

/** Das aktuellste Semester der Liste (unabhängig von deren Sortierung). */
export function newestSemester<T extends SemesterLike>(semesters: T[]): T | null {
  if (semesters.length === 0) return null;
  return sortSemestersDesc(semesters)[0];
}
