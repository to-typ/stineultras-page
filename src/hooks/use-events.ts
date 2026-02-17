import { useState, useEffect, useCallback } from "react";
import { Event, SearchResult, Visibility } from "@/types/planner";
import {
  LOCAL_STORAGE_KEY,
  getInterval,
  getContrastColor,
  generateRandomColor,
} from "@/lib/planner-utils";
import { toast } from "sonner";
import { NewEventData } from "@/components/addeventmodal";

export function useEvents(initialEvents: Event[] = []) {
  const [events, setEvents] = useState<Event[]>(initialEvents);

  // Lade Events aus localStorage beim ersten Render
  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem(LOCAL_STORAGE_KEY)
        : null;
    if (stored) {
      setEvents(JSON.parse(stored));
    }
  }, []);

  // Speichere Events in localStorage bei Änderungen
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
    }
  }, [events]);

  const addEvent = useCallback(
    (newEventData: NewEventData) => {
      if (newEventData.name.trim() === "") return;

      const textColor = getContrastColor(newEventData.color);

      const newEvent: Event = {
        id: Math.max(...events.map((e) => e.id), 0) * 1000 + 1,
        name: newEventData.name,
        shortname:
          newEventData.name.length > 10
            ? newEventData.name.slice(0, 10) + "..."
            : newEventData.name,
        active: Visibility.Visible,
        bgcolor: newEventData.color,
        textcolor: textColor,
        events: [
          {
            name: newEventData.name,
            shortname:
              newEventData.name.length > 10
                ? newEventData.name.slice(0, 10) + "..."
                : newEventData.name,
            active: Visibility.Visible,
            dates: [
              {
                day: newEventData.date.day,
                start: newEventData.date.start,
                end: newEventData.date.end,
              },
            ],
          },
        ],
      };

      setEvents([...events, newEvent]);
    },
    [events],
  );

  const addSearchResult = useCallback(
    (ev: SearchResult) => {
      // Prüfe ob Event bereits existiert
      const exists = events.some((e) => e.id === ev.veranstaltung.id);
      if (exists) {
        toast.error("Diese Veranstaltung ist bereits in deinem Stundenplan");
        return false;
      }

      // Sammle alle Termine
      const allTermine: {
        termine: typeof ev.termine;
        name: string;
        shortname: string;
      }[] = [];

      if (ev.termine && ev.termine.length > 0) {
        allTermine.push({
          termine: ev.termine,
          name: ev.veranstaltung.name,
          shortname: ev.veranstaltung.stineName,
        });
      } else if (ev.uebungsgruppen && ev.uebungsgruppen.length > 0) {
        for (const ug of ev.uebungsgruppen) {
          if (ug.termine && ug.termine.length > 0) {
            allTermine.push({
              termine: ug.termine,
              name: ug.uebungsgruppe.name,
              shortname:
                ug.uebungsgruppe.name.length > 10
                  ? ug.uebungsgruppe.name.slice(0, 10) + "..."
                  : ug.uebungsgruppe.name,
            });
          }
        }
      }

      if (allTermine.length === 0) {
        toast.error("Diese Veranstaltung hat keine Termine");
        return false;
      }

      const bgcolor = generateRandomColor();
      const textcolor = getContrastColor(bgcolor);

      const subEvents = allTermine.map((terminGroup) => {
        const dates = terminGroup.termine!.map((termin) => {
          const interval = getInterval([termin]);
          return {
            day: interval.tag,
            start: interval.start,
            end: interval.end,
          };
        });

        return {
          name: terminGroup.name,
          shortname: terminGroup.shortname,
          active: Visibility.Visible,
          dates: dates,
        };
      });

      const newEvent: Event = {
        id: ev.veranstaltung.id,
        name: ev.veranstaltung.name,
        shortname: ev.veranstaltung.stineName,
        active: Visibility.Visible,
        bgcolor: bgcolor,
        textcolor: textcolor,
        events: subEvents,
      };

      setEvents((prevEvents) => [...prevEvents, newEvent]);
      toast.success(`${ev.veranstaltung.name} wurde hinzugefügt`);
      return true;
    },
    [events],
  );

  const toggleEvent = useCallback((id: number) => {
    setEvents((events) =>
      events.map((ev) =>
        ev.id === id
          ? {
              ...ev,
              active:
                ev.active === Visibility.Visible
                  ? Visibility.Hidden
                  : Visibility.Visible,
              events: ev.events.map((subEv) => ({
                ...subEv,
                active:
                  ev.active === Visibility.Visible
                    ? Visibility.Hidden
                    : Visibility.Visible,
              })),
            }
          : ev,
      ),
    );
  }, []);

  const removeEvent = useCallback((id: number) => {
    setEvents((events) => events.filter((ev) => ev.id !== id));
  }, []);

  const toggleSubEvent = useCallback((eventId: number, subName: string) => {
    setEvents((events) =>
      events.map((ev) => {
        if (ev.id !== eventId) return ev;
        const switchState = ev.events.map((subEv) =>
          subEv.name === subName
            ? subEv.active === Visibility.Visible
              ? Visibility.Hidden
              : Visibility.Visible
            : subEv.active,
        );
        return {
          ...ev,
          events: ev.events.map((subEv) =>
            subEv.name === subName
              ? {
                  ...subEv,
                  active:
                    subEv.active === Visibility.Visible
                      ? Visibility.Hidden
                      : Visibility.Visible,
                }
              : subEv,
          ),
          active: switchState.every((state) => state === Visibility.Visible)
            ? Visibility.Visible
            : switchState.every((state) => state === Visibility.Hidden)
              ? Visibility.Hidden
              : Visibility.Partial,
        };
      }),
    );
  }, []);

  const clearAllEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    addEvent,
    addSearchResult,
    toggleEvent,
    removeEvent,
    toggleSubEvent,
    clearAllEvents,
  };
}
