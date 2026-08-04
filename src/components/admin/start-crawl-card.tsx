"use client";

import { useState } from "react";
import { AlertTriangle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StartJobArgs } from "@/hooks/use-crawl-jobs";
import type { CrawlJobDto, CrawlJobTyp, SemesterDto } from "@/types/crawl";

type Props = {
  semesters: SemesterDto[];
  active: CrawlJobDto | null;
  onStart: (args: StartJobArgs) => Promise<boolean>;
};

export function StartCrawlCard({ semesters, active, onStart }: Props) {
  const [semesterId, setSemesterId] = useState<string>("");
  const [typ, setTyp] = useState<CrawlJobTyp>("VERANSTALTUNGEN");
  const [delayEnabled, setDelayEnabled] = useState(true);
  const [delayBase, setDelayBase] = useState("1000");
  const [delayJitter, setDelayJitter] = useState("1000");
  const [starting, setStarting] = useState(false);

  const semester = semesters.find((s) => String(s.id) === semesterId) ?? null;
  const urlForTyp = semester
    ? typ === "VERANSTALTUNGEN"
      ? semester.crawlUrl
      : semester.modulCrawlUrl
    : null;

  const blockedReason = active
    ? "Es läuft bereits ein Job. Warte, bis er fertig ist, oder stoppe ihn oben."
    : !semester
      ? "Bitte ein Semester auswählen."
      : !urlForTyp
        ? typ === "VERANSTALTUNGEN"
          ? `Für „${semester.name}“ ist keine Veranstaltungs-URL hinterlegt — siehe Sektion „Semester verwalten“.`
          : `Für „${semester.name}“ ist keine Modul-URL hinterlegt — siehe Sektion „Semester verwalten“.`
        : null;

  const handleStart = async () => {
    if (!semester) {
      return;
    }
    setStarting(true);
    await onStart({
      typ,
      semesterId: semester.id,
      delayBaseMs: delayEnabled ? Number(delayBase) : 0,
      delayJitterMs: delayEnabled ? Number(delayJitter) : 0,
    });
    setStarting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crawl starten</CardTitle>
        <CardDescription>
          Die STiNE-Einstiegspunkte hängen am Semester und werden unten verwaltet.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="semester">Semester</Label>
            <Select value={semesterId} onValueChange={setSemesterId}>
              <SelectTrigger id="semester">
                <SelectValue placeholder="Semester wählen" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                    {!s.crawlUrl && !s.modulCrawlUrl ? " — keine URLs" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Was soll gecrawlt werden?</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={typ === "VERANSTALTUNGEN" ? "default" : "outline"}
                onClick={() => setTyp("VERANSTALTUNGEN")}>
                Veranstaltungen
              </Button>
              <Button
                type="button"
                variant={typ === "MODULE" ? "default" : "outline"}
                onClick={() => setTyp("MODULE")}>
                Module
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={delayEnabled}
              onChange={(e) => setDelayEnabled(e.target.checked)}
              className="h-4 w-4"
            />
            Verzögerung zwischen Requests
          </label>

          {delayEnabled ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="delay-base">Basis (ms)</Label>
                <Input
                  id="delay-base"
                  type="number"
                  min={0}
                  max={60000}
                  value={delayBase}
                  onChange={(e) => setDelayBase(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="delay-jitter">Zufälliger Aufschlag bis (ms)</Label>
                <Input
                  id="delay-jitter"
                  type="number"
                  min={0}
                  max={60000}
                  value={delayJitter}
                  onChange={(e) => setDelayJitter(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <p className="flex items-start gap-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Ohne Verzögerung laufen die Requests ungebremst gegen die Uni-Server. Nur für kurze
              Testläufe verwenden.
            </p>
          )}
        </div>

        {blockedReason && <p className="text-sm text-muted-foreground">{blockedReason}</p>}

        <Button
          onClick={handleStart}
          disabled={blockedReason !== null || starting}
          className="self-start">
          <Play className="mr-2 h-4 w-4" />
          {starting ? "Wird gestartet…" : "Crawl starten"}
        </Button>
      </CardContent>
    </Card>
  );
}
