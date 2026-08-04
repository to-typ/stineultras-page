export type ProgressFrame = {
  /** Wie viele Geschwister auf dieser Ebene bereits abgearbeitet sind. */
  index: number;
  /** Wie viele Geschwister es auf dieser Ebene insgesamt gibt. */
  total: number;
};

/**
 * Anteil des bereits abgearbeiteten Menübaums, abgeleitet aus der Position im
 * Baum. Jede Ebene trägt ihren Indexanteil bei, gewichtet mit dem Kehrwert
 * aller darüberliegenden Ebenen — der zweite Knoten einer 12er-Ebene ist eben
 * nur ein Zwölftel wert.
 *
 * Setzt voraus, dass Geschwisterteilbäume ähnlich groß sind. Das stimmt nie
 * exakt, korrigiert sich mit zunehmender Tiefe aber selbst.
 */
export function computeProgress(frames: ProgressFrame[]): number {
  let progress = 0;
  let weight = 1;

  for (const frame of frames) {
    if (frame.total <= 0) {
      continue;
    }
    progress += weight * (frame.index / frame.total);
    weight = weight / frame.total;
  }

  return Math.min(1, Math.max(0, progress));
}
