import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, X } from "lucide-react";
import { DAYS } from "@/lib/planner-utils";

type EventDate = {
  day: string;
  start: string;
  end: string;
};

type EventGroup = {
  name: string;
  dates: EventDate[];
};

export type NewEventData = {
  name: string;
  color: string;
  groups: EventGroup[];
};

type AddEventModalProps = {
  open: boolean;
  onAdd: (data: NewEventData) => void;
  onCancel: () => void;
};

export default function AddEventModal({
  open,
  onAdd,
  onCancel,
}: AddEventModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#d32f2f");
  const [groups, setGroups] = useState<EventGroup[]>([
    {
      name: "Standard",
      dates: [{ day: "Mo", start: "08:00", end: "10:00" }],
    },
  ]);
  const [firstGroupManuallyChanged, setFirstGroupManuallyChanged] =
    useState(false);

  // Synchronisiere den Namen der ersten Gruppe mit dem Event-Namen
  useEffect(() => {
    if (!firstGroupManuallyChanged && name.trim()) {
      setGroups((prevGroups) => {
        if (prevGroups.length > 0) {
          const updated = [...prevGroups];
          updated[0].name = name;
          return updated;
        }
        return prevGroups;
      });
    }
  }, [name, firstGroupManuallyChanged]);

  const handleAddGroup = () => {
    setGroups([
      ...groups,
      {
        name: `Gruppe ${groups.length + 1}`,
        dates: [{ day: "Mo", start: "08:00", end: "10:00" }],
      },
    ]);
  };

  const handleRemoveGroup = (groupIndex: number) => {
    if (groups.length > 1) {
      setGroups(groups.filter((_, i) => i !== groupIndex));
    }
  };

  const handleGroupNameChange = (groupIndex: number, newName: string) => {
    const updated = [...groups];
    updated[groupIndex].name = newName;
    setGroups(updated);
    // Markiere erste Gruppe als manuell geändert
    if (groupIndex === 0) {
      setFirstGroupManuallyChanged(true);
    }
  };

  const handleAddDate = (groupIndex: number) => {
    const updated = [...groups];
    updated[groupIndex].dates.push({ day: "Mo", start: "08:00", end: "10:00" });
    setGroups(updated);
  };

  const handleRemoveDate = (groupIndex: number, dateIndex: number) => {
    const updated = [...groups];
    if (updated[groupIndex].dates.length > 1) {
      updated[groupIndex].dates = updated[groupIndex].dates.filter(
        (_, i) => i !== dateIndex,
      );
      setGroups(updated);
    }
  };

  const handleDateChange = (
    groupIndex: number,
    dateIndex: number,
    field: keyof EventDate,
    value: string,
  ) => {
    const updated = [...groups];
    updated[groupIndex].dates[dateIndex][field] = value;
    setGroups(updated);
  };

  const handleSubmit = () => {
    if (name.trim()) {
      onAdd({ name, color, groups });
      // Reset
      setName("");
      setColor("#d32f2f");
      setGroups([
        {
          name: "Standard",
          dates: [{ day: "Mo", start: "08:00", end: "10:00" }],
        },
      ]);
      setFirstGroupManuallyChanged(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    // Reset
    setName("");
    setColor("#d32f2f");
    setGroups([
      {
        name: "Standard",
        dates: [{ day: "Mo", start: "08:00", end: "10:00" }],
      },
    ]);
    setFirstGroupManuallyChanged(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Eigenes Event hinzufügen</DialogTitle>
          <DialogDescription>
            Erstelle ein Event mit mehreren Gruppen und Terminen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name und Farbe */}
          <div className="flex gap-3">
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Event-Name"
              className="flex-1"
            />
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 border rounded cursor-pointer"
              />
            </div>
          </div>

          <Separator />

          {/* Gruppen */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {groups.map((group, groupIndex) => (
                <Card key={groupIndex}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={group.name}
                        onChange={(e) =>
                          handleGroupNameChange(groupIndex, e.target.value)
                        }
                        placeholder="Gruppen-Name"
                        className="flex-1 h-8 text-sm"
                      />
                      {groups.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveGroup(groupIndex)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          title="Gruppe entfernen">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {group.dates.map((date, dateIndex) => (
                      <div
                        key={dateIndex}
                        className="flex items-center gap-2 p-2 rounded-md bg-accent/30">
                        <select
                          value={date.day}
                          onChange={(e) =>
                            handleDateChange(
                              groupIndex,
                              dateIndex,
                              "day",
                              e.target.value,
                            )
                          }
                          className="border rounded px-2 py-1 text-xs flex-shrink-0">
                          {DAYS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                        <input
                          type="time"
                          value={date.start}
                          onChange={(e) =>
                            handleDateChange(
                              groupIndex,
                              dateIndex,
                              "start",
                              e.target.value,
                            )
                          }
                          className="flex-1 border rounded px-2 py-1 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">-</span>
                        <input
                          type="time"
                          value={date.end}
                          onChange={(e) =>
                            handleDateChange(
                              groupIndex,
                              dateIndex,
                              "end",
                              e.target.value,
                            )
                          }
                          className="flex-1 border rounded px-2 py-1 text-xs"
                        />
                        {group.dates.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveDate(groupIndex, dateIndex)
                            }
                            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                            title="Termin entfernen">
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddDate(groupIndex)}
                      className="w-full h-8 text-xs"
                      title="Weiteren Termin zu dieser Gruppe hinzufügen">
                      <Plus className="h-3 w-3 mr-1" />
                      Termin hinzufügen
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <Button
            variant="outline"
            onClick={handleAddGroup}
            className="w-full"
            title="Neue Gruppe (z.B. verschiedene Übungsgruppen) hinzufügen">
            <Plus className="h-4 w-4 mr-2" />
            Gruppe hinzufügen
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            title="Abbrechen und Dialog schließen">
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim()}
            title="Veranstaltung zum Stundenplan hinzufügen">
            Hinzufügen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
