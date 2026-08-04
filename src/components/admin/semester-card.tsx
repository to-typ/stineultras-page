"use client";

import { useState } from "react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SemesterDto } from "@/types/crawl";

type Draft = {
  id: number | null;
  name: string;
  crawlUrl: string;
  modulCrawlUrl: string;
  isSelectable: boolean;
};

const emptyDraft: Draft = {
  id: null,
  name: "",
  crawlUrl: "",
  modulCrawlUrl: "",
  isSelectable: true,
};

export function SemesterCard({
  semesters,
  onChanged,
}: {
  semesters: SemesterDto[];
  onChanged: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!draft) {
      return;
    }
    setSaving(true);

    const isNew = draft.id === null;
    const response = await fetch(
      isNew ? "/api/admin/semesters" : `/api/admin/semesters/${draft.id}`,
      {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          crawlUrl: draft.crawlUrl,
          modulCrawlUrl: draft.modulCrawlUrl,
          isSelectable: draft.isSelectable,
        }),
      },
    );

    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast.error(data.error ?? "Speichern fehlgeschlagen.");
      return;
    }

    toast.success(isNew ? "Semester angelegt." : "Semester gespeichert.");
    setDraft(null);
    await onChanged();
  };

  const deleteData = async (semester: SemesterDto) => {
    const response = await fetch("/api/admin/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ semesterId: semester.id }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      toast.error(data.error ?? "Löschen fehlgeschlagen.");
      return;
    }
    toast.success(data.message ?? "Daten gelöscht.");
    await onChanged();
  };

  const deleteSemester = async (semester: SemesterDto) => {
    const response = await fetch(`/api/admin/semesters/${semester.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      toast.error(data.error ?? "Löschen fehlgeschlagen.");
      return;
    }
    toast.success("Semester gelöscht.");
    await onChanged();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Semester verwalten</CardTitle>
          <CardDescription>
            Die STiNE-Einstiegspunkte je Semester. Ohne URL lässt sich der jeweilige Crawl nicht
            starten.
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setDraft({ ...emptyDraft })}>
          <Plus className="mr-2 h-4 w-4" />
          Neu
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {semesters.length === 0 && (
          <p className="text-sm text-muted-foreground">Noch kein Semester angelegt.</p>
        )}

        {semesters.map((semester) => (
          <div
            key={semester.id}
            className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{semester.name}</span>
                {!semester.isSelectable && (
                  <span className="text-xs text-muted-foreground">(ausgeblendet)</span>
                )}
                <span className="text-xs text-muted-foreground">
                  {semester.veranstaltungenCount} Veranstaltungen · {semester.modulCount} Module
                </span>
              </div>
              <UrlLine label="Veranstaltungen" url={semester.crawlUrl} />
              <UrlLine label="Module" url={semester.modulCrawlUrl} />
            </div>

            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                variant="outline"
                aria-label={`${semester.name} bearbeiten`}
                onClick={() =>
                  setDraft({
                    id: semester.id,
                    name: semester.name,
                    crawlUrl: semester.crawlUrl ?? "",
                    modulCrawlUrl: semester.modulCrawlUrl ?? "",
                    isSelectable: semester.isSelectable,
                  })
                }>
                <Pencil className="h-4 w-4" />
              </Button>

              <ConfirmButton
                title={`Daten von „${semester.name}“ löschen?`}
                description="Veranstaltungen, Übungsgruppen, Termine und Module dieses Semesters werden gelöscht. Das Semester samt URLs bleibt bestehen."
                onConfirm={() => deleteData(semester)}
                label="Daten löschen"
              />

              <ConfirmButton
                title={`Semester „${semester.name}“ löschen?`}
                description="Nur möglich, wenn keine Veranstaltungen und Module mehr daran hängen."
                onConfirm={() => deleteSemester(semester)}
                icon
              />
            </div>
          </div>
        ))}
      </CardContent>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {draft?.id === null ? "Semester anlegen" : "Semester bearbeiten"}
            </DialogTitle>
            <DialogDescription>
              Die URLs sind die STiNE-Einstiegsseiten für den jeweiligen Crawl.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="sem-name">Name</Label>
                <Input
                  id="sem-name"
                  value={draft.name}
                  placeholder="WiSe 26/27"
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="sem-crawl">Veranstaltungs-URL</Label>
                <Input
                  id="sem-crawl"
                  value={draft.crawlUrl}
                  onChange={(e) => setDraft({ ...draft, crawlUrl: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="sem-modul">Modul-URL</Label>
                <Input
                  id="sem-modul"
                  value={draft.modulCrawlUrl}
                  onChange={(e) => setDraft({ ...draft, modulCrawlUrl: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={draft.isSelectable}
                  onChange={(e) => setDraft({ ...draft, isSelectable: e.target.checked })}
                />
                Im öffentlichen Stundenplan auswählbar
              </label>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Abbrechen
            </Button>
            <Button onClick={save} disabled={saving || !draft?.name.trim()}>
              {saving ? "Wird gespeichert…" : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function UrlLine({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return <p className="text-xs text-muted-foreground">{label}: keine URL hinterlegt</p>;
  }

  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="truncate" title={url}>
        {label}: {url.slice(0, 60)}…
      </span>
      <button
        type="button"
        aria-label={`${label}-URL kopieren`}
        onClick={() => {
          void navigator.clipboard.writeText(url);
          toast.success("URL kopiert.");
        }}>
        <Copy className="h-3 w-3" />
      </button>
    </p>
  );
}

function ConfirmButton({
  title,
  description,
  onConfirm,
  label,
  icon,
}: {
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
  label?: string;
  icon?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" aria-label={icon ? title : undefined}>
          {icon ? <Trash2 className="h-4 w-4" /> : label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Löschen</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
