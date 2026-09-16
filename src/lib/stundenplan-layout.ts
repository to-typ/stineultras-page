import { Event, Visibility } from "@/types/planner";
import { DAYS } from "./planner-utils";

/**
 * Baut aus den Events des Stundenplans das Raster der LaTeX-Vorlage:
 * eine Zeile pro Stunde, eine Spalte pro Wochentag. Termine über mehrere
 * Stunden werden zu einem Block verschmolzen (\multirow), parallele Termine
 * teilen sich die Tagesspalte nebeneinander auf.
 *
 * Reines Modell ohne PDF-Abhängigkeit — der Renderer liegt in `pdf-export.ts`.
 */

/** Zeitfenster der Vorlage; wird erweitert, wenn Termine davor/danach liegen. */
export const DEFAULT_START_HOUR = 8;
export const DEFAULT_END_HOUR = 18;

export type PlanBlock = {
  /** Beschriftung ohne Anzahl, z. B. "SE1-Ü". */
  label: string;
  /** Parallele Übungsgruppen in diesem Slot — wird als "(n)" angehängt. */
  count: number;
  /** Alternativtermin (grau gesetzt) statt fester Termin. */
  muted: boolean;
  /** Zeilenindex relativ zu `startHour`, `rowEnd` exklusiv. */
  rowStart: number;
  rowEnd: number;
  /** Position innerhalb der Tagesspalte: Spur `lane` von `lanes` Spuren. */
  lane: number;
  lanes: number;
};

export type PlanDay = {
  day: string;
  blocks: PlanBlock[];
};

export type PlanGrid = {
  startHour: number;
  /** Exklusiv — die letzte Zeile ist `endHour - 1` bis `endHour`. */
  endHour: number;
  days: PlanDay[];
};

type RawBlock = {
  day: string;
  startMin: number;
  endMin: number;
  label: string;
  count: number;
  muted: boolean;
};

function timeToMinutes(time: string): number | null {
  const [h, m] = time.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

/**
 * Sammelt alle sichtbaren Termine als Rohblöcke. Termine derselben
 * Veranstaltung, die zur gleichen Zeit am gleichen Tag liegen, werden zu einem
 * Block mit Anzahl zusammengefasst — so wird aus sechs DM-Übungsgruppen am
 * Freitag ein einziges "DM-Ü (6)".
 */
function collectBlocks(events: Event[]): RawBlock[] {
  const blocks: RawBlock[] = [];

  for (const ev of events) {
    if (ev.active === Visibility.Hidden) continue;

    const visibleSubs = ev.events.filter((sub) => sub.active === Visibility.Visible);
    if (visibleSubs.length === 0) continue;

    // Veranstaltungen aus STiNE mit mehreren sichtbaren Gruppen sind
    // Alternativen: Man belegt am Ende nur eine davon, deshalb grau und unter
    // dem gemeinsamen Namen der Veranstaltung. Eigene Events sind dagegen
    // immer feste Termine.
    const isAlternative = ev.info != null && visibleSubs.length > 1;
    const hasMultipleSubs = visibleSubs.length > 1;
    // Im Info-Dialog gesetzte Kalenderbezeichnung — dieselbe wie im ICS-Export.
    const eventLabel = ev.icsName || ev.shortname || ev.name;

    // Slot-Key -> Gruppen, die in diesem Slot liegen, nach Gruppenname.
    const slots = new Map<string, { day: string; startMin: number; endMin: number; subs: Map<string, SubLabel> }>();

    for (const sub of visibleSubs) {
      for (const date of sub.dates) {
        if (!DAYS.includes(date.day)) continue;
        const startMin = timeToMinutes(date.start);
        const endMin = timeToMinutes(date.end);
        if (startMin == null || endMin == null || endMin <= startMin) continue;

        const key = `${date.day}|${startMin}|${endMin}`;
        const slot = slots.get(key) ?? { day: date.day, startMin, endMin, subs: new Map<string, SubLabel>() };
        // Map nach Gruppenname: Wöchentlich wiederholte Termine derselben
        // Gruppe zählen einmal.
        slot.subs.set(sub.name, { icsName: sub.icsName, label: sub.shortname || sub.name });
        slots.set(key, slot);
      }
    }

    for (const slot of slots.values()) {
      const subs = [...slot.subs.values()];
      blocks.push({
        day: slot.day,
        startMin: slot.startMin,
        endMin: slot.endMin,
        label: slotLabel(subs, { eventLabel, eventIcsName: ev.icsName, isAlternative, hasMultipleSubs }),
        count: subs.length,
        muted: isAlternative,
      });
    }
  }

  return blocks;
}

type SubLabel = { icsName?: string; label: string };

/**
 * Beschriftung eines Slots. Selbst gesetzte Kalenderbezeichnungen gewinnen
 * immer — mit derselben Rangfolge wie im ICS-Export: bei einer einzelnen
 * Gruppe zählt die Bezeichnung der Veranstaltung, bei mehreren die der Gruppe.
 */
function slotLabel(
  subs: SubLabel[],
  ev: { eventLabel: string; eventIcsName?: string; isAlternative: boolean; hasMultipleSubs: boolean },
): string {
  // Mehrere Gruppen im selben Slot teilen sich den Namen der Veranstaltung.
  if (subs.length > 1) return ev.eventLabel;
  if (!ev.hasMultipleSubs) return ev.eventIcsName || subs[0].label;
  return subs[0].icsName || (ev.isAlternative ? ev.eventLabel : subs[0].label);
}

/**
 * Verteilt die Blöcke eines Tages auf Spuren. Blöcke, die sich (auch über
 * Ketten) überlappen, bilden einen Cluster und teilen sich dessen Spurenzahl —
 * dadurch wird die Tagesspalte nur dort senkrecht geteilt, wo wirklich
 * parallele Termine liegen.
 */
function assignLanes(blocks: PlanBlock[]) {
  const sorted = [...blocks].sort(
    (a, b) => a.rowStart - b.rowStart || b.rowEnd - a.rowEnd || a.label.localeCompare(b.label),
  );

  let cluster: PlanBlock[] = [];
  let clusterEnd = -1;
  let laneEnds: number[] = [];

  const closeCluster = () => {
    for (const block of cluster) block.lanes = laneEnds.length;
    cluster = [];
    laneEnds = [];
  };

  for (const block of sorted) {
    if (block.rowStart >= clusterEnd) {
      closeCluster();
      clusterEnd = block.rowEnd;
    } else {
      clusterEnd = Math.max(clusterEnd, block.rowEnd);
    }

    let lane = laneEnds.findIndex((end) => end <= block.rowStart);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = block.rowEnd;
    block.lane = lane;
    cluster.push(block);
  }
  closeCluster();
}

export function buildPlanGrid(events: Event[]): PlanGrid {
  const raw = collectBlocks(events);

  // Raster der Vorlage, erweitert um Termine außerhalb von 8–18 Uhr.
  let startHour = DEFAULT_START_HOUR;
  let endHour = DEFAULT_END_HOUR;
  for (const block of raw) {
    startHour = Math.min(startHour, Math.floor(block.startMin / 60));
    endHour = Math.max(endHour, Math.ceil(block.endMin / 60));
  }

  const days: PlanDay[] = DAYS.map((day) => ({ day, blocks: [] }));

  for (const block of raw) {
    const dayEntry = days.find((d) => d.day === block.day);
    if (!dayEntry) continue;
    // Angebrochene Stunden füllen die ganze Zeile — wie in der Vorlage, die
    // nur volle Stunden kennt.
    dayEntry.blocks.push({
      label: block.label,
      count: block.count,
      muted: block.muted,
      rowStart: Math.floor(block.startMin / 60) - startHour,
      rowEnd: Math.ceil(block.endMin / 60) - startHour,
      lane: 0,
      lanes: 1,
    });
  }

  for (const day of days) assignLanes(day.blocks);

  return { startHour, endHour, days };
}

/** Beschriftung inklusive Gruppenanzahl, z. B. "DM-Ü (6)". */
export function blockText(block: PlanBlock): string {
  return block.count > 1 ? `${block.label} (${block.count})` : block.label;
}

/** Zeilenbeschriftung der Zeitspalte, z. B. "10-11". */
export function rowLabel(grid: PlanGrid, row: number): string {
  const hour = grid.startHour + row;
  return `${hour}-${hour + 1}`;
}
