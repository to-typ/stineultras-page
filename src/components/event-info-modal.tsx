import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Event } from "@/types/planner";
import { Termin } from "@prisma/client";
import { Trash2 } from "lucide-react";

type EventInfoModalProps = {
  open: boolean;
  event: Event | null;
  onClose: () => void;
  onChangeEventIcsName: (name: string) => void;
  onChangeSubIcsName: (subName: string, name: string) => void;
  onRemoveTermin: (terminId: number) => void;
};

/** Ein einzelner Termin mit Datum, Uhrzeit, Raum und Löschen-Button. */
function TerminRow({ termin, onRemove }: { termin: Termin; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-accent/30">
      <span className="text-sm font-medium">{termin.nummer}</span>
      <span className="text-sm">
        {new Date(termin.tag).toLocaleDateString("de-DE", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
        :{" "}
        {new Date(termin.startZeit).toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        })}{" "}
        -{" "}
        {new Date(termin.endZeit).toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
      <span className="text-sm font-medium">{termin.raum}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="ml-auto h-7 w-7 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        title="Diesen Termin aus deinem Stundenplan entfernen"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export default function EventInfoModal({
  open,
  event,
  onClose,
  onChangeEventIcsName,
  onChangeSubIcsName,
  onRemoveTermin,
}: EventInfoModalProps) {
  const [eventIcsName, setEventIcsName] = useState("");
  const [subIcsNames, setSubIcsNames] = useState<Record<string, string>>({});

  // Sync local state when event changes
  useEffect(() => {
    if (event) {
      setEventIcsName(event.icsName ?? "");
      const names: Record<string, string> = {};
      event.events.forEach((sub) => {
        names[sub.name] = sub.icsName ?? "";
      });
      setSubIcsNames(names);
    }
  }, [event]);

  const hasMultipleSubs = (event?.events.length ?? 0) > 1;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>{event?.name || "Event Details"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {event?.info && (
            <>
              <div className="flex flex-row">
                <div className="w-3/4 gap-2 flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Kürzel:</span>
                    <span className="text-sm">{event?.shortname || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Lehrende:</span>
                    <span className="text-sm">{event.info.veranstaltung.lehrende || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Typ:</span>
                    <span className="text-sm">{event.info.veranstaltung.typ || "-"}</span>
                  </div>
                </div>
                <div className="flex w-1/4 items-center justify-center">
                  <a
                    href={event.info.veranstaltung.url}
                    className="text-sm text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    In STiNE ansehen
                  </a>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Kalenderbezeichnung */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Kalenderbezeichnung</label>
            <Input
              placeholder={event?.name || ""}
              value={eventIcsName}
              onChange={(e) => {
                setEventIcsName(e.target.value);
                onChangeEventIcsName(e.target.value);
              }}
              className="h-8 text-sm"
            />
            <p className="text-xs text-muted-foreground">Überschreibt den Namen im ICS-Export für dieses Event.</p>
          </div>

          {hasMultipleSubs && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Gruppen-Bezeichnungen im Kalender</p>
                {event?.events.map((sub) => (
                  <div key={sub.name} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-48 truncate" title={sub.name}>
                      {sub.name}
                    </span>
                    <Input
                      placeholder={sub.name}
                      value={subIcsNames[sub.name] ?? ""}
                      onChange={(ev) => {
                        setSubIcsNames((prev) => ({
                          ...prev,
                          [sub.name]: ev.target.value,
                        }));
                        onChangeSubIcsName(sub.name, ev.target.value);
                      }}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {event?.info && (
            <>
              <Separator />
              {/* Gruppen & Termine */}
              <p className="text-xs text-muted-foreground">
                Gelöschte Termine verschwinden nur aus deinem lokalen Stundenplan — in STiNE bleiben sie bestehen.
              </p>
              <ScrollArea className="h-[280px] pr-4">
                <div className="space-y-4">
                  {event.info.uebungsgruppen?.map((group, groupIndex) => (
                    <Card key={groupIndex}>
                      <CardHeader className="pb-3">
                        {event.events.length > 1 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{group.uebungsgruppe.name}</span>
                          </div>
                        )}
                        <div className="flex">
                          <span className="text-xs text-muted-foreground">Termine:</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {group.termine.map((termin) => (
                          <TerminRow key={termin.id} termin={termin} onRemove={() => onRemoveTermin(termin.id)} />
                        ))}
                        {group.termine.length === 0 && (
                          <p className="text-xs text-muted-foreground">Keine Termine mehr in deinem Stundenplan.</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {event.info.termine && (
                    <Card key={1}>
                      <CardHeader className="pb-3">
                        <div className="flex">
                          <span className="text-sm font-medium">Termine:</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {event.info.termine.map((termin) => (
                          <TerminRow key={termin.id} termin={termin} onRemove={() => onRemoveTermin(termin.id)} />
                        ))}
                        {event.info.termine.length === 0 && (
                          <p className="text-xs text-muted-foreground">Keine Termine mehr in deinem Stundenplan.</p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} title="Dialog schließen">
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
