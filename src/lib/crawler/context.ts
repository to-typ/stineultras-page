import { prisma } from "@/lib/prisma";
import { computeProgress, type ProgressFrame } from "@/lib/crawler/progress";

/** Ein Messpunkt für die Durchsatz-Diagramme im Panel. Kumulative Werte. */
export type CrawlSample = {
  /** Millisekunden seit Jobstart. */
  t: number;
  /** Requests gesamt. */
  r: number;
  /** Veranstaltungen gesamt. */
  v: number;
  /** Termine gesamt. */
  d: number;
  /** Fortschrittsbruch 0…1. */
  p: number;
};

const COUNTER_FLUSH_MS = 2000;
const SAMPLE_INTERVAL_MS = 30000;

/**
 * Trägt Wartezeiten, Abbruchprüfung und Fortschrittszählung durch die
 * rekursiven Crawl-Funktionen. Zähler werden im Speicher gehalten und
 * höchstens alle zwei Sekunden geschrieben, damit nicht jeder HTTP-Request
 * einen DB-Write auslöst.
 */
export class CrawlContext {
  private frames: ProgressFrame[] = [];
  private samples: CrawlSample[] = [];
  private startedAt = Date.now();
  private lastFlush = 0;
  private lastSample = 0;
  private stopCache = false;
  /**
   * Höchststand statt Momentanwert: beim Abbau der Rekursion werden alle
   * Frames gepoppt, der Momentanwert fiele am Ende also auf 0 zurück und jeder
   * beendete Job stünde in der Historie bei 0 %.
   */
  private maxProgress = 0;

  private menus = 0;
  private veranstaltungen = 0;
  private uebungsgruppen = 0;
  private termine = 0;
  private requests = 0;
  private currentUrl: string | null = null;

  constructor(
    readonly jobId: string,
    private readonly delayBaseMs: number,
    private readonly delayJitterMs: number,
  ) {}

  /** Ersetzt das feste setTimeout aus dem alten Crawler. */
  async wait(): Promise<void> {
    const ms = this.delayBaseMs + Math.random() * this.delayJitterMs;
    if (ms <= 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Liest den zwischengespeicherten Stopp-Wunsch; aufgefrischt beim Flush. */
  async shouldStop(): Promise<boolean> {
    await this.flush();
    return this.stopCache;
  }

  enterMenu(total: number): void {
    this.frames.push({ index: 0, total });
  }

  advanceMenu(): void {
    const frame = this.frames[this.frames.length - 1];
    if (frame) {
      frame.index += 1;
    }
  }

  exitMenu(): void {
    this.frames.pop();
  }

  trackRequest(url: string): void {
    this.requests += 1;
    this.currentUrl = url;
  }

  trackMenu(): void {
    this.menus += 1;
  }

  trackVeranstaltung(): void {
    this.veranstaltungen += 1;
  }

  trackUebungsgruppe(): void {
    this.uebungsgruppen += 1;
  }

  trackTermine(n: number): void {
    this.termine += n;
  }

  /**
   * Schreibt Zähler und Fortschritt in die Job-Zeile und liest dabei den
   * Stopp-Wunsch mit. Ein Fehler hier darf einen stundenlangen Lauf nicht
   * abbrechen, deshalb wird er nur geloggt.
   */
  async flush(force = false): Promise<void> {
    const now = Date.now();
    if (!force && now - this.lastFlush < COUNTER_FLUSH_MS) {
      return;
    }
    this.lastFlush = now;

    this.maxProgress = Math.max(this.maxProgress, computeProgress(this.frames));
    const progress = this.maxProgress;

    if (force || now - this.lastSample >= SAMPLE_INTERVAL_MS) {
      this.lastSample = now;
      this.samples.push({
        t: now - this.startedAt,
        r: this.requests,
        v: this.veranstaltungen,
        d: this.termine,
        p: progress,
      });
    }

    try {
      const job = await prisma.crawlJob.update({
        where: { id: this.jobId },
        data: {
          menus: this.menus,
          veranstaltungen: this.veranstaltungen,
          uebungsgruppen: this.uebungsgruppen,
          termine: this.termine,
          requests: this.requests,
          progress,
          currentUrl: this.currentUrl,
          samples: this.samples,
        },
        select: { stopRequested: true },
      });
      this.stopCache = job.stopRequested;
    } catch (error) {
      console.error(`Fortschritt für Job ${this.jobId} konnte nicht geschrieben werden:`, error);
    }
  }
}

export function createCrawlContext(
  jobId: string,
  delayBaseMs: number,
  delayJitterMs: number,
): CrawlContext {
  return new CrawlContext(jobId, delayBaseMs, delayJitterMs);
}
