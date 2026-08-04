"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Square } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { estimateEtaMs, formatDuration, formatEta, ratesPerMinute } from "@/lib/crawl-metrics";
import type { CrawlJobDto } from "@/types/crawl";

const chartConfig = {
  veranstaltungen: { label: "Veranstaltungen/min", color: "hsl(var(--chart-1))" },
  requests: { label: "Requests/min", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

type Props = {
  job: CrawlJobDto;
  /** Für die Anfangs-Prognose: abgeschlossene Läufe desselben Typs. */
  history: CrawlJobDto[];
  onStop: (id: string) => Promise<void>;
};

export function ActiveJobCard({ job, history, onStop }: Props) {
  const detail = useJobDetail(job.id, job.requests);
  const samples = detail?.samples ?? [];

  const startedAt = job.startedAt ? new Date(job.startedAt).getTime() : null;
  const elapsedMs = useElapsed(startedAt);

  const expectedRequests =
    history.find((h) => h.typ === job.typ && h.status === "COMPLETED")?.requests ?? null;

  const etaMs = estimateEtaMs({
    elapsedMs,
    progress: job.progress,
    requests: job.requests,
    samples,
    expectedRequests,
  });

  const finishAt = etaMs !== null ? new Date(Date.now() + etaMs) : null;
  const rates = ratesPerMinute(samples).slice(-120);
  const secondsPerVeranstaltung =
    job.veranstaltungen > 0 ? elapsedMs / job.veranstaltungen / 1000 : null;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle>{job.semesterName}</CardTitle>
          <Badge variant="secondary">
            {job.typ === "VERANSTALTUNGEN" ? "Komplett" : "Nur Module"}
          </Badge>
          <Badge variant={job.stopRequested ? "destructive" : "default"}>
            {job.stopRequested ? "Stopp angefordert" : "Läuft"}
          </Badge>
          <span className="text-sm text-muted-foreground">seit {formatDuration(elapsedMs)}</span>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={job.stopRequested}>
              <Square className="mr-2 h-4 w-4" />
              Stoppen
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Crawl stoppen?</AlertDialogTitle>
              <AlertDialogDescription>
                Der Crawler hält am nächsten Menüpunkt an. Bereits gespeicherte Daten bleiben
                erhalten; ein späterer Lauf ergänzt den Rest.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={() => onStop(job.id)}>Stoppen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="font-medium">{(job.progress * 100).toFixed(1)} %</span>
            <span className="text-muted-foreground">
              {formatEta(etaMs)}
              {finishAt &&
                ` · voraussichtlich fertig um ${finishAt.toLocaleTimeString("de-DE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${Math.min(100, job.progress * 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Laufzeit" value={formatDuration(elapsedMs)} />
          <Kpi
            label="Ø pro Veranstaltung"
            value={secondsPerVeranstaltung ? `${secondsPerVeranstaltung.toFixed(1)} s` : "—"}
          />
          <Kpi label="Requests" value={String(job.requests)} />
          <Kpi label="Menüs" value={String(job.menus)} />
          <Kpi label="Veranstaltungen" value={String(job.veranstaltungen)} />
          <Kpi label="Übungsgruppen" value={String(job.uebungsgruppen)} />
          <Kpi label="Termine" value={String(job.termine)} />
          <Kpi
            label="Verzögerung"
            value={
              job.delayBaseMs === 0 && job.delayJitterMs === 0
                ? "aus"
                : `${job.delayBaseMs} + 0–${job.delayJitterMs} ms`
            }
          />
        </div>

        {rates.length > 1 ? (
          <ChartContainer config={chartConfig} className="h-56 w-full">
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
        ) : (
          <p className="text-sm text-muted-foreground">
            Der erste Messpunkt entsteht nach 30 Sekunden Laufzeit.
          </p>
        )}

        {job.currentUrl && (
          <p className="truncate text-xs text-muted-foreground" title={job.currentUrl}>
            Aktuell: {job.currentUrl}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

/**
 * Die Listen-API liefert bewusst keine Samples. Für das Diagramm werden sie
 * nachgeladen, aber nur wenn sich die Request-Zahl deutlich bewegt hat — sonst
 * würde jedes 2-Sekunden-Poll eine zweite Anfrage auslösen.
 */
function useJobDetail(jobId: string, requests: number) {
  const [detail, setDetail] = useState<CrawlJobDto | null>(null);
  // Alle 30 gezählten Requests neu laden — grob der Sample-Takt.
  const bucket = Math.floor(requests / 30);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/crawl-jobs/${jobId}`)
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
  }, [jobId, bucket]);

  return detail;
}

/** Laufzeit sekundengenau, ohne dafür die API zu befragen. */
function useElapsed(startedAt: number | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return startedAt ? Math.max(0, now - startedAt) : 0;
}
