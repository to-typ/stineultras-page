import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createCrawlContext } from "@/lib/crawler/context";
import { crawlModule } from "@/lib/crawler/moduls";
import { crawlVeranstaltungen } from "@/lib/crawler/veranstaltungen";
import type { CrawlJobDto, CrawlJobTyp, CrawlSampleDto } from "@/types/crawl";

export const MAX_DELAY_MS = 60000;

export type StartJobInput = {
  typ: CrawlJobTyp;
  semesterId: number;
  delayBaseMs: number;
  delayJitterMs: number;
};

export type StartJobResult =
  | { ok: true; job: CrawlJobDto }
  | { ok: false; code: "BUSY" | "NO_URL" | "BAD_DELAY" | "NO_SEMESTER"; message: string };

const jobWithSemester = Prisma.validator<Prisma.CrawlJobDefaultArgs>()({
  include: { semester: { select: { name: true } } },
});
type JobWithSemester = Prisma.CrawlJobGetPayload<typeof jobWithSemester>;

function toDto(job: JobWithSemester, withSamples: boolean): CrawlJobDto {
  return {
    id: job.id,
    typ: job.typ,
    status: job.status,
    semesterId: job.semesterId,
    semesterName: job.semester.name,
    stopRequested: job.stopRequested,
    delayBaseMs: job.delayBaseMs,
    delayJitterMs: job.delayJitterMs,
    currentUrl: job.currentUrl,
    menus: job.menus,
    veranstaltungen: job.veranstaltungen,
    uebungsgruppen: job.uebungsgruppen,
    termine: job.termine,
    requests: job.requests,
    progress: job.progress,
    error: job.error,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    ...(withSamples ? { samples: (job.samples as unknown as CrawlSampleDto[]) ?? [] } : {}),
  };
}

/**
 * Ohne Herzschlag seit dieser Zeitspanne gilt ein Job als tot. Der Crawler
 * schreibt bei jedem Request (gedrosselt auf 2 s), die Spanne ist also
 * großzügig gewählt — lieber ein toter Job, der eine Minute zu lange als
 * laufend gilt, als ein lebender, der abgeräumt wird.
 */
const STALE_AFTER_MS = 60000;

/**
 * Ein Job, der einen Server-Neustart nicht überlebt hat, stünde für immer auf
 * RUNNING und würde durch die Ein-Job-Sperre jeden weiteren Start blockieren.
 *
 * Die Erkennung läuft ausschließlich über `heartbeatAt`: Ein Merker im Prozess
 * wäre nach jedem Modul-Reload und in jeder zweiten Server-Instanz wieder
 * leer und würde dann laufende Jobs als verwaist markieren, während sie im
 * Hintergrund munter weitercrawlen.
 */
export async function reconcileOrphans(): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_AFTER_MS);

  await prisma.crawlJob.updateMany({
    where: {
      status: { in: ["PENDING", "RUNNING"] },
      OR: [
        { heartbeatAt: { lt: cutoff } },
        // Noch kein Flush passiert: dann zählt, wann der Job angelegt wurde.
        { heartbeatAt: null, createdAt: { lt: cutoff } },
      ],
    },
    data: {
      status: "ERROR",
      error: "Server wurde neu gestartet",
      completedAt: new Date(),
    },
  });
}

export async function listJobs(): Promise<{
  active: CrawlJobDto | null;
  history: CrawlJobDto[];
}> {
  await reconcileOrphans();

  const [active, history] = await Promise.all([
    prisma.crawlJob.findFirst({
      where: { status: { in: ["PENDING", "RUNNING"] } },
      ...jobWithSemester,
    }),
    prisma.crawlJob.findMany({
      where: { status: { in: ["COMPLETED", "STOPPED", "ERROR"] } },
      orderBy: { createdAt: "desc" },
      take: 25,
      ...jobWithSemester,
    }),
  ]);

  return {
    active: active ? toDto(active, false) : null,
    history: history.map((job) => toDto(job, false)),
  };
}

export async function getJob(id: string): Promise<CrawlJobDto | null> {
  const job = await prisma.crawlJob.findUnique({ where: { id }, ...jobWithSemester });
  return job ? toDto(job, true) : null;
}

export async function stopJob(id: string): Promise<boolean> {
  const updated = await prisma.crawlJob.updateMany({
    where: { id, status: { in: ["PENDING", "RUNNING"] } },
    data: { stopRequested: true },
  });
  return updated.count > 0;
}

export async function startJob(input: StartJobInput): Promise<StartJobResult> {
  await reconcileOrphans();

  const { typ, semesterId, delayBaseMs, delayJitterMs } = input;

  if (
    !Number.isInteger(delayBaseMs) ||
    !Number.isInteger(delayJitterMs) ||
    delayBaseMs < 0 ||
    delayJitterMs < 0 ||
    delayBaseMs > MAX_DELAY_MS ||
    delayJitterMs > MAX_DELAY_MS
  ) {
    return {
      ok: false,
      code: "BAD_DELAY",
      message: `Verzögerungen müssen ganze Zahlen zwischen 0 und ${MAX_DELAY_MS} ms sein.`,
    };
  }

  const semester = await prisma.semester.findUnique({ where: { id: semesterId } });
  if (!semester) {
    return { ok: false, code: "NO_SEMESTER", message: "Semester nicht gefunden." };
  }

  const url = typ === "VERANSTALTUNGEN" ? semester.crawlUrl : semester.modulCrawlUrl;
  if (!url) {
    return {
      ok: false,
      code: "NO_URL",
      message:
        typ === "VERANSTALTUNGEN"
          ? `Für "${semester.name}" ist keine Veranstaltungs-URL hinterlegt.`
          : `Für "${semester.name}" ist keine Modul-URL hinterlegt.`,
    };
  }

  let job: JobWithSemester;
  try {
    job = await prisma.crawlJob.create({
      data: { typ, semesterId, delayBaseMs, delayJitterMs, status: "PENDING" },
      ...jobWithSemester,
    });
  } catch (error) {
    // P2002 = Unique-Verletzung, hier der partielle Index auf aktive Jobs.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, code: "BUSY", message: "Es läuft bereits ein Crawl-Job." };
    }
    throw error;
  }

  void runJob(job.id, typ, url, semesterId, delayBaseMs, delayJitterMs);

  return { ok: true, job: toDto(job, false) };
}

/** Läuft im Hintergrund weiter, nachdem die Route längst geantwortet hat. */
async function runJob(
  jobId: string,
  typ: CrawlJobTyp,
  url: string,
  semesterId: number,
  delayBaseMs: number,
  delayJitterMs: number,
): Promise<void> {
  const ctx = createCrawlContext(jobId, delayBaseMs, delayJitterMs);

  try {
    await prisma.crawlJob.update({
      where: { id: jobId },
      data: { status: "RUNNING", startedAt: new Date(), heartbeatAt: new Date() },
    });

    console.log(`Starting crawl job ${jobId} (${typ}) for semester ${semesterId}`);

    if (typ === "VERANSTALTUNGEN") {
      await crawlVeranstaltungen(ctx, url, semesterId);
    } else {
      await crawlModule(ctx, url, semesterId);
    }

    const stopped = await prisma.crawlJob
      .findUnique({ where: { id: jobId }, select: { stopRequested: true } })
      .then((j) => j?.stopRequested ?? false);

    await prisma.crawlJob.update({
      where: { id: jobId },
      data: {
        status: stopped ? "STOPPED" : "COMPLETED",
        completedAt: new Date(),
        // Ein durchgelaufener Crawl ist per Definition fertig; der aus der
        // Baumposition geschätzte Wert bleibt sonst knapp darunter stehen.
        ...(stopped ? {} : { progress: 1 }),
      },
    });
  } catch (error) {
    console.error(`Crawl job ${jobId} fehlgeschlagen:`, error);
    await prisma.crawlJob
      .update({
        where: { id: jobId },
        data: {
          status: "ERROR",
          error: error instanceof Error ? error.message : "Unbekannter Fehler",
          completedAt: new Date(),
        },
      })
      .catch(() => {});
  }
}
