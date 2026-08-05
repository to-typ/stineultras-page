"use client";

import { ActiveJobCard } from "@/components/admin/active-job-card";
import { JobHistoryCard } from "@/components/admin/job-history-card";
import { SemesterCard } from "@/components/admin/semester-card";
import { StartCrawlCard } from "@/components/admin/start-crawl-card";
import { SystemCard } from "@/components/admin/system-card";
import { useCrawlJobs } from "@/hooks/use-crawl-jobs";

export default function AdminPanel() {
  const { active, history, semesters, loading, refresh, startJob, stopJob } =
    useCrawlJobs();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-8 relative">
      <h1 className="text-2xl font-bold text-white">Admin-Panel</h1>

      {loading ? (
        <p className="text-white/80">Wird geladen…</p>
      ) : (
        <>
          {active && (
            <ActiveJobCard job={active} history={history} onStop={stopJob} />
          )}
          <StartCrawlCard
            semesters={semesters}
            active={active}
            onStart={startJob}
          />
          <JobHistoryCard history={history} semesters={semesters} />
          <SemesterCard semesters={semesters} onChanged={refresh} />
          <SystemCard onChanged={refresh} />
        </>
      )}
    </main>
  );
}
