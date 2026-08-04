import type { CrawlSampleDto } from "@/types/crawl";

const MINUTE_MS = 60000;

/** Ab hier gilt der Fortschrittsbruch als tragfähig genug zum Extrapolieren. */
const TREE_TRUST_FLOOR = 0.02;
/** Ab hier wird ausschließlich extrapoliert. */
const TREE_TRUST_CEILING = 0.05;
/** Über so viele Samples wird die Baumschätzung geglättet. */
const SMOOTHING_WINDOW = 5;

export type RatePoint = {
  /** Millisekunden seit Jobstart. */
  t: number;
  veranstaltungen: number;
  requests: number;
};

/**
 * Die Samples enthalten kumulative Zähler. Für die Diagramme brauchen wir
 * Raten, also die Differenz zum Vorgänger, hochgerechnet auf eine Minute.
 */
export function ratesPerMinute(samples: CrawlSampleDto[]): RatePoint[] {
  const points: RatePoint[] = [];

  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1];
    const cur = samples[i];
    const dt = cur.t - prev.t;
    if (dt <= 0) {
      continue;
    }
    const factor = MINUTE_MS / dt;
    points.push({
      t: cur.t,
      veranstaltungen: Math.round((cur.v - prev.v) * factor),
      requests: Math.round((cur.r - prev.r) * factor),
    });
  }

  return points;
}

export type EtaInput = {
  elapsedMs: number;
  progress: number;
  requests: number;
  samples: CrawlSampleDto[];
  /** Requests des letzten abgeschlossenen Laufs desselben Typs. */
  expectedRequests: number | null;
};

/**
 * Restzeit in Millisekunden, oder null solange keine belastbare Schätzung
 * möglich ist.
 *
 * Primär wird aus der Baumposition extrapoliert: bei halbem Fortschritt nach
 * zehn Minuten bleiben zehn Minuten. Solange der Fortschritt aber noch winzig
 * ist, schwankt diese Rechnung stark — dort greift stattdessen die Anzahl
 * Requests des letzten vollständigen Laufs. Dazwischen wird übergeblendet.
 */
export function estimateEtaMs(input: EtaInput): number | null {
  const { elapsedMs, progress, requests, samples, expectedRequests } = input;

  const tree = progress > 0 ? smoothedTreeEta(samples, elapsedMs, progress) : null;

  const priorExists = expectedRequests !== null && requests > 0 && elapsedMs > 0;
  const priorOvertaken = priorExists && expectedRequests <= requests;
  const prior =
    priorExists && !priorOvertaken ? (expectedRequests - requests) * (elapsedMs / requests) : null;

  if (progress < TREE_TRUST_FLOOR) {
    if (prior !== null) {
      return prior;
    }
    // Der Lauf ist bereits über die Prognose hinaus — dann ist die Prognose
    // wertlos und die Baumschätzung trotz kleinem Fortschritt das Bessere.
    // Ohne jede Vorlaufdaten bleibt in dieser Phase nur „unbekannt".
    return priorOvertaken ? tree : null;
  }

  if (tree === null) {
    return prior;
  }

  if (progress >= TREE_TRUST_CEILING || prior === null) {
    return tree;
  }

  const weight = (progress - TREE_TRUST_FLOOR) / (TREE_TRUST_CEILING - TREE_TRUST_FLOOR);
  return prior * (1 - weight) + tree * weight;
}

/**
 * Jeder Messpunkt liefert eine eigene Schätzung der Gesamtdauer. Auf "ab jetzt"
 * umgerechnet und gemittelt ergibt das eine Zahl, die nicht bei jedem Poll
 * springt.
 */
function smoothedTreeEta(samples: CrawlSampleDto[], elapsedMs: number, progress: number): number {
  const estimates: number[] = [(elapsedMs * (1 - progress)) / progress];

  const window = samples.filter((s) => s.p > 0 && s.t > 0).slice(-SMOOTHING_WINDOW);
  for (const sample of window) {
    const totalFromSample = sample.t / sample.p;
    const remaining = totalFromSample - elapsedMs;
    if (remaining > 0) {
      estimates.push(remaining);
    }
  }

  return estimates.reduce((sum, value) => sum + value, 0) / estimates.length;
}

/** Kompakte Dauer für KPI-Kacheln und die Historie. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));

  if (totalSeconds < 60) {
    return `${totalSeconds} s`;
  }

  const totalMinutes = Math.round(totalSeconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

/**
 * Bewusst grob gerundet — die Schätzung ist nicht genauer als fünf Minuten,
 * und eine sekundengenaue Anzeige würde das Gegenteil suggerieren.
 */
export function formatEta(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms < 0) {
    return "wird ermittelt";
  }

  if (ms < MINUTE_MS) {
    return "unter 1 Minute";
  }

  const roundedMinutes = Math.max(5, Math.round(ms / (5 * MINUTE_MS)) * 5);
  return `noch ca. ${formatDuration(roundedMinutes * MINUTE_MS)}`;
}
