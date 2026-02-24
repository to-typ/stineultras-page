import { useState, useEffect, useCallback } from "react";
import { Event, SearchResult, Visibility } from "@/types/planner";
import {
  LOCAL_STORAGE_KEY,
  getInterval,
  getContrastColor,
  generateRandomColor,
} from "@/lib/planner-utils";
import { toast } from "sonner";
import { NewEventData } from "@/components/add-event-modal";

export function useEvents(initialEvents: Event[] = []) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [isLoaded, setIsLoaded] = useState(false);

  // Lade Events aus localStorage beim ersten Render
  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem(LOCAL_STORAGE_KEY)
        : null;
    if (stored) {
      setEvents(JSON.parse(stored));
    }
    setIsLoaded(true);
  }, []);

  // Speichere Events in localStorage bei Änderungen (erst nach initialem Laden)
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
    }
  }, [events, isLoaded]);

  const addEvent = useCallback(
    (newEventData: NewEventData) => {
      if (newEventData.name.trim() === "") return;

      const textColor = getContrastColor(newEventData.color);

      // Konvertiere Gruppen in SubEvents
      const subEvents = newEventData.groups.map((group) => ({
        name: group.name,
        shortname: group.name,
        active: Visibility.Visible,
        dates: group.dates,
      }));

      const newEvent: Event = {
        id: Math.max(...events.map((e) => e.id), 0) * 1000 + 1,
        name: newEventData.name,
        shortname: newEventData.name,
        active: Visibility.Visible,
        bgcolor: newEventData.color,
        textcolor: textColor,
        events: subEvents,
        info: null,
      };

      setEvents([...events, newEvent]);
      toast.success(`${newEventData.name} wurde hinzugefügt`);
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
        info: SearchResult;
      }[] = [];

      if (ev.termine && ev.termine.length > 0) {
        allTermine.push({
          termine: ev.termine,
          name: ev.veranstaltung.name,
          shortname: ev.veranstaltung.stineName,
          info: ev,
        });
      } else if (ev.uebungsgruppen && ev.uebungsgruppen.length > 0) {
        for (const ug of ev.uebungsgruppen) {
          if (ug.termine && ug.termine.length > 0) {
            allTermine.push({
              termine: ug.termine,
              name: ug.uebungsgruppe.name,
              shortname: ug.uebungsgruppe.name,
              info: ev,
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
            room: interval.room,
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
        info: ev,
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
