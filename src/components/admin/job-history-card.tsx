"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatDuration, ratesPerMinute } from "@/lib/crawl-metrics";
import { sortSemestersAsc } from "@/lib/semester-sort";
import type { CrawlJobDto, CrawlJobStatus, SemesterDto } from "@/types/crawl";

const throughputConfig = {
  veranstaltungen: { label: "Veranstaltungen/min", color: "hsl(var(--chart-1))" },
  requests: { label: "Requests/min", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const semesterConfig = {
  veranstaltungen: { label: "Veranstaltungen", color: "hsl(var(--chart-1))" },
  module: { label: "Module", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const statusLabel: Record<CrawlJobStatus, string> = {
  PENDING: "Wartet",
  RUNNING: "Läuft",
  COMPLETED: "Fertig",
  STOPPED: "Gestoppt",
  ERROR: "Fehler",
};

const statusVariant: Record<CrawlJobStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  RUNNING: "default",
  COMPLETED: "secondary",
  STOPPED: "outline",
  ERROR: "destructive",
};

export function JobHistoryCard({
  history,
  semesters,
}: {
  history: CrawlJobDto[];
  semesters: SemesterDto[];
}) {
  // Im Diagramm läuft die Zeit von links nach rechts: ältestes Semester zuerst.
  const semesterData = sortSemestersAsc(semesters).map((s) => ({
    name: s.name,
    veranstaltungen: s.veranstaltungenCount,
    module: s.modulCount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job-Historie</CardTitle>
        <CardDescription>Die letzten 25 Läufe.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine abgeschlossenen Läufe.</p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {history.map((job) => (
              <AccordionItem key={job.id} value={job.id}>
                <AccordionTrigger>
                  <div className="flex flex-1 flex-wrap items-center gap-3 pr-3 text-left">
                    <Badge variant={statusVariant[job.status]}>{statusLabel[job.status]}</Badge>
                    <span className="font-medium">{job.semesterName}</span>
                    <span className="text-sm text-muted-foreground">
                      {job.typ === "VERANSTALTUNGEN" ? "Komplett" : "Nur Module"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(job.createdAt).toLocaleString("de-DE")}
                    </span>
                    <span className="ml-auto text-sm text-muted-foreground">
                      {duration(job)} · {job.veranstaltungen} V · {job.termine} T
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <JobDetail job={job} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Datenbestand je Semester</h3>
          {semesterData.length > 0 ? (
            <ChartContainer config={semesterConfig} className="h-56 w-full">
              <BarChart data={semesterData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={50} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="veranstaltungen" fill="var(--color-veranstaltungen)" radius={4} />
                <Bar dataKey="module" fill="var(--color-module)" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground">Noch keine Semester angelegt.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function JobDetail({ job }: { job: CrawlJobDto }) {
  const [detail, setDetail] = useState<CrawlJobDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/crawl-jobs/${job.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [job.id]);

  const rates = ratesPerMinute(detail?.samples ?? []);

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
        <Detail label="Menüs" value={String(job.menus)} />
        <Detail label="Veranstaltungen" value={String(job.veranstaltungen)} />
        <Detail label="Übungsgruppen" value={String(job.uebungsgruppen)} />
        <Detail label="Termine" value={String(job.termine)} />
        <Detail label="Requests" value={String(job.requests)} />
        <Detail label="Fortschritt" value={`${(job.progress * 100).toFixed(1)} %`} />
        <Detail
          label="Verzögerung"
          value={
            job.delayBaseMs === 0 && job.delayJitterMs === 0
              ? "aus"
              : `${job.delayBaseMs} + 0–${job.delayJitterMs} ms`
          }
        />
        <Detail label="Dauer" value={duration(job)} />
      </dl>

      {job.error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{job.error}</p>
      )}

      {rates.length > 1 && (
        <ChartContainer config={throughputConfig} className="h-48 w-full">
          <AreaChart data={rates}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="t"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => formatDuration(value)}
            />
            <YAxis tickLine={false} axisLine={false} width={40} />
            <ChartTooltip
              content={
                <ChartTooltipContent labelFormatter={(value) => formatDuration(Number(value))} />
              }
            />
            <Area
              dataKey="requests"
              type="monotone"
              stroke="var(--color-requests)"
              fill="var(--color-requests)"
              fillOpacity={0.2}
            />
            <Area
              dataKey="veranstaltungen"
              type="monotone"
              stroke="var(--color-veranstaltungen)"
              fill="var(--color-veranstaltungen)"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function duration(job: CrawlJobDto): string {
  if (!job.startedAt || !job.completedAt) {
    return "—";
  }
  return formatDuration(new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime());
}
