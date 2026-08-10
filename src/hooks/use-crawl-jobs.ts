"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { sortSemestersDesc } from "@/lib/semester-sort";
import type { CrawlJobDto, CrawlJobTyp, SemesterDto } from "@/types/crawl";

const POLL_ACTIVE_MS = 2000;
const POLL_IDLE_MS = 15000;

export type StartJobArgs = {
  typ: CrawlJobTyp;
  semesterId: number;
  delayBaseMs: number;
  delayJitterMs: number;
};

export function useCrawlJobs() {
  const [active, setActive] = useState<CrawlJobDto | null>(null);
  const [history, setHistory] = useState<CrawlJobDto[]>([]);
  const [semesters, setSemesters] = useState<SemesterDto[]>([]);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSemesters = useCallback(async () => {
    const response = await fetch("/api/admin/semesters");
    if (response.ok) {
      // Chronologisch, neuestes Semester zuerst.
      setSemesters(sortSemestersDesc(await response.json()));
    }
  }, []);

  const loadJobs = useCallback(async () => {
    const response = await fetch("/api/admin/crawl-jobs");
    if (!response.ok) {
      return null;
    }
    const data: { active: CrawlJobDto | null; history: CrawlJobDto[] } = await response.json();
    setActive(data.active);
    setHistory(data.history);
    return data.active;
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadJobs(), loadSemesters()]);
  }, [loadJobs, loadSemesters]);

  // Solange ein Job läuft, häufiger nachfragen. Der Timer wird nach jeder
  // Antwort neu gesetzt, damit sich langsame Antworten nicht stauen.
  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      const runningJob = await loadJobs();
      if (cancelled) {
        return;
      }
      setLoading(false);
      timer.current = setTimeout(tick, runningJob ? POLL_ACTIVE_MS : POLL_IDLE_MS);
    };

    void loadSemesters();
    void tick();

    return () => {
      cancelled = true;
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [loadJobs, loadSemesters]);

  const startJob = useCallback(
    async (args: StartJobArgs) => {
      const response = await fetch("/api/admin/crawl-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Job konnte nicht gestartet werden.");
        await refresh();
        return false;
      }

      toast.success("Crawl-Job gestartet.");
      await refresh();
      return true;
    },
    [refresh],
  );

  const stopJob = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/admin/crawl-jobs/${id}/stop`, { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error ?? "Stopp konnte nicht angefordert werden.");
        return;
      }
      toast.info("Stopp angefordert — der Crawler hält am nächsten Menüpunkt an.");
      await loadJobs();
    },
    [loadJobs],
  );

  return { active, history, semesters, loading, refresh, startJob, stopJob };
}
