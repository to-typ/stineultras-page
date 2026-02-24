import { Event } from "@/types/planner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Trash2 } from "lucide-react";
import { EventCard } from "./event-card";

interface EventListProps {
  events: Event[];
  onToggleEvent: (id: number) => void;
  onRemoveEvent: (id: number) => void;
  onToggleSubEvent: (eventId: number, subName: string) => void;
  onClearAll: () => void;
  onShowInfo: (id: number) => void;
  onColorChange: (id: number, color: string) => void;
}

export function EventList({
  events,
  onToggleEvent,
  onRemoveEvent,
  onToggleSubEvent,
  onClearAll,
  onShowInfo,
  onColorChange,
}: EventListProps) {
  return (
    <Card className="shadow-md flex-1">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Meine Veranstaltungen ({events.length})
          </CardTitle>
          {events.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-8 text-xs text-destructive hover:text-destructive">
              <Trash2 className="h-3 w-3 mr-1" />
              Alle löschen
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Noch keine Veranstaltungen vorhanden</p>
            <p className="text-xs mt-1">
              Suche nach Veranstaltungen oder füge eigene hinzu
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-4">
              {events.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onToggle={() => onToggleEvent(ev.id)}
                  onRemove={() => onRemoveEvent(ev.id)}
                  onToggleSub={(subName) => onToggleSubEvent(ev.id, subName)}
                  onShowInfo={() => onShowInfo(ev.id)}
                  onColorChange={(color) => onColorChange(ev.id, color)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
