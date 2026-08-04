export type CrawlJobTyp = "VERANSTALTUNGEN" | "MODULE";

export type CrawlJobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "STOPPED" | "ERROR";

export type CrawlSampleDto = {
  /** Millisekunden seit Jobstart. */
  t: number;
  /** Requests kumulativ. */
  r: number;
  /** Veranstaltungen kumulativ. */
  v: number;
  /** Termine kumulativ. */
  d: number;
  /** Fortschrittsbruch 0…1. */
  p: number;
};

export type CrawlJobDto = {
  id: string;
  typ: CrawlJobTyp;
  status: CrawlJobStatus;
  semesterId: number;
  semesterName: string;
  stopRequested: boolean;
  delayBaseMs: number;
  delayJitterMs: number;
  currentUrl: string | null;
  menus: number;
  veranstaltungen: number;
  uebungsgruppen: number;
  termine: number;
  requests: number;
  progress: number;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  /** Nur im Detail-Endpoint gefüllt. */
  samples?: CrawlSampleDto[];
};

export type SemesterDto = {
  id: number;
  name: string;
  isSelectable: boolean;
  crawlUrl: string | null;
  modulCrawlUrl: string | null;
  veranstaltungenCount: number;
  modulCount: number;
};
