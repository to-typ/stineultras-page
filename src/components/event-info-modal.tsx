import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Event } from "@/types/planner";

type EventInfoModalProps = {
  open: boolean;
  event: Event | null;
  onClose: () => void;
  onChangeEventIcsName: (name: string) => void;
  onChangeSubIcsName: (subName: string, name: string) => void;
};

export default function EventInfoModal({
  open,
  event,
  onClose,
  onChangeEventIcsName,
  onChangeSubIcsName,
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
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Kürzel:</span>
                <span className="text-sm">{event?.shortname || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Lehrende:</span>
                <span className="text-sm">
                  {event?.info?.veranstaltung.lehrende || "-"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Typ:</span>
                <span className="text-sm">
                  {event?.info?.veranstaltung.typ || "-"}
                </span>
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
            <p className="text-xs text-muted-foreground">
              Überschreibt den Namen im ICS-Export für dieses Event.
            </p>
          </div>

          {hasMultipleSubs && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Gruppen-Bezeichnungen im Kalender
                </p>
                {event?.events.map((sub) => (
                  <div key={sub.name} className="flex items-center gap-2">
                    <span
                      className="text-sm text-muted-foreground w-48 truncate"
                      title={sub.name}>
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
              <ScrollArea className="h-[280px] pr-4">
                <div className="space-y-4">
                  {event.info.uebungsgruppen?.map((group, groupIndex) => (
                    <Card key={groupIndex}>
                      <CardHeader className="pb-3">
                        {event.events.length > 1 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {group.uebungsgruppe.name}
                            </span>
                          </div>
                        )}
                        <div className="flex">
                          <span className="text-xs text-muted-foreground">
                            Termine:
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {group.termine.map((date, dateIndex) => (
                          <div
                            key={dateIndex}
                            className="flex items-center gap-2 p-2 rounded-md bg-accent/30">
                            <span className="text-sm font-medium">
                              {date.nummer}
                            </span>
                            <span className="text-sm">
                              {new Date(date.tag).toLocaleDateString("de-DE", {
                                weekday: "short",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                              :{" "}
                              {new Date(date.startZeit).toLocaleTimeString(
                                "de-DE",
                                { hour: "2-digit", minute: "2-digit" },
                              )}{" "}
                              -{" "}
                              {new Date(date.endZeit).toLocaleTimeString(
                                "de-DE",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                            <span className="text-sm font-medium">
                              {date.raum}
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
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
