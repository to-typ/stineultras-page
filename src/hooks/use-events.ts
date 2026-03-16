import { useState, useEffect, useCallback } from "react";
import { Event, SearchResult, Visibility } from "@/types/planner";
import { LOCAL_STORAGE_KEY, getInterval, getContrastColor, generateRandomColor } from "@/lib/planner-utils";
import { toast } from "sonner";
import { NewEventData } from "@/components/add-event-modal";

export function useEvents(initialEvents: Event[] = [], useLocalStorage: boolean = true) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [isLoaded, setIsLoaded] = useState(false);

  // Lade Events aus localStorage beim ersten Render (nur wenn useLocalStorage true ist)
  useEffect(() => {
    if (useLocalStorage) {
      const stored = typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
      if (stored) {
        setEvents(JSON.parse(stored));
      }
    }
    setIsLoaded(true);
  }, [useLocalStorage]);

  // Speichere Events in localStorage bei Änderungen (erst nach initialem Laden, nur wenn useLocalStorage true ist)
  useEffect(() => {
    if (isLoaded && useLocalStorage && typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
    }
  }, [events, isLoaded, useLocalStorage]);

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
      return newEvent.id;
    },
    [events],
  );

  const addSearchResult = useCallback(
    (ev: SearchResult) => {
      // Prüfe ob Event bereits existiert
      const exists = events.some((e) => e.id === ev.veranstaltung.id);
      if (exists) {
        toast.error("Diese Veranstaltung ist bereits in deinem Stundenplan");
        return null;
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
        return null;
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
      return newEvent.id;
    },
    [events],
  );

  const addModuleByID = useCallback(
    async (moduleId: number) => {
      const res = await fetch(`/api/moduls?id=${moduleId}`);
      const data = await res.json();
      const modul = data[0];
      if (!modul.veranstaltungen || modul.veranstaltungen.length === 0) {
        toast.error("Keine Veranstaltungen in diesem Modul gefunden");
        return false;
      }
      modul.veranstaltungen.forEach((veranstaltung: SearchResult) => {
        addSearchResult(veranstaltung);
      });
      return true;
    },
    [addSearchResult],
  );

  const toggleEvent = useCallback((id: number) => {
    setEvents((events) =>
      events.map((ev) =>
        ev.id === id
          ? {
              ...ev,
              active: ev.active === Visibility.Visible ? Visibility.Hidden : Visibility.Visible,
              events: ev.events.map((subEv) => ({
                ...subEv,
                active: ev.active === Visibility.Visible ? Visibility.Hidden : Visibility.Visible,
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
                  active: subEv.active === Visibility.Visible ? Visibility.Hidden : Visibility.Visible,
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

  const changeEventColor = useCallback((id: number, color: string) => {
    const textcolor = getContrastColor(color);
    setEvents((events) => events.map((ev) => (ev.id === id ? { ...ev, bgcolor: color, textcolor } : ev)));
  }, []);

  // Prüft ob zwei Zeitslots überlappen
  const timesOverlap = useCallback(
    (day1: string, start1: string, end1: string, day2: string, start2: string, end2: string) => {
      if (day1 !== day2) return false;

      const [h1Start, m1Start] = start1.split(":").map(Number);
      const [h1End, m1End] = end1.split(":").map(Number);
      const [h2Start, m2Start] = start2.split(":").map(Number);
      const [h2End, m2End] = end2.split(":").map(Number);

      const mins1Start = h1Start * 60 + m1Start;
      const mins1End = h1End * 60 + m1End;
      const mins2Start = h2Start * 60 + m2Start;
      const mins2End = h2End * 60 + m2End;

      return mins1Start < mins2End && mins2Start < mins1End;
    },
    [],
  );

  const prioritizeEvent = useCallback(
    (id: number) => {
      const targetEvent = events.find((ev) => ev.id === id);
      if (!targetEvent) return;

      // Toggle: Wenn bereits priorisiert, stelle vorherigen Zustand wieder her
      if (targetEvent.prioritized) {
        setEvents((events) =>
          events.map((ev) => {
            if (ev.id === id) {
              return { ...ev, prioritized: false };
            }

            // Blende alle SubEvents wieder ein, die durch DIESES Event ausgeblendet wurden
            const restoredSubEvents = ev.events.map((subEv) => {
              // Prüfe ob dieser SubEvent durch das zu de-priorisierende Event ausgeblendet wurde
              const wasHiddenByThisEvent =
                subEv.hiddenByPriority &&
                subEv.dates.some((date) =>
                  targetEvent.events.some(
                    (targetSubEv) =>
                      targetSubEv.active === Visibility.Visible &&
                      targetSubEv.dates.some((targetDate) =>
                        timesOverlap(date.day, date.start, date.end, targetDate.day, targetDate.start, targetDate.end),
                      ),
                  ),
                );

              if (wasHiddenByThisEvent) {
                // Prüfe ob es noch andere priorisierte Events gibt, die diesen Termin ausblenden
                const stillHiddenByOthers = events.some(
                  (otherEv) =>
                    otherEv.id !== id &&
                    otherEv.prioritized &&
                    otherEv.events.some(
                      (otherSubEv) =>
                        otherSubEv.active === Visibility.Visible &&
                        otherSubEv.dates.some((otherDate) =>
                          subEv.dates.some((date) =>
                            timesOverlap(date.day, date.start, date.end, otherDate.day, otherDate.start, otherDate.end),
                          ),
                        ),
                    ),
                );

                if (!stillHiddenByOthers) {
                  return {
                    ...subEv,
                    active: Visibility.Visible,
                    hiddenByPriority: false,
                  };
                }
              }
              return subEv;
            });

            // Update Event visibility
            const allHidden = restoredSubEvents.every((se) => se.active === Visibility.Hidden);
            const allVisible = restoredSubEvents.every((se) => se.active === Visibility.Visible);

            return {
              ...ev,
              events: restoredSubEvents,
              active: allHidden ? Visibility.Hidden : allVisible ? Visibility.Visible : Visibility.Partial,
            };
          }),
        );
        toast.info("Priorisierung aufgehoben");
        return;
      }

      // Sammle alle Zeitslots des zu priorisierenden Events
      const prioritySlots = targetEvent.events
        .filter((subEv) => subEv.active === Visibility.Visible)
        .flatMap((subEv) => subEv.dates);

      if (prioritySlots.length === 0) {
        toast.error("Keine sichtbaren Termine zum Priorisieren");
        return;
      }

      // Setze Event als priorisiert und blende überlappende aus
      setEvents((events) =>
        events.map((ev) => {
          if (ev.id === id) {
            return { ...ev, prioritized: true };
          }

          // Blende überlappende SubEvents aus (behalte Priorisierung anderer Events)
          const updatedSubEvents = ev.events.map((subEv) => {
            // Prüfe ob dieses SubEvent mit einem Priority-Slot überlappt
            const hasOverlap = subEv.dates.some((date) =>
              prioritySlots.some((pSlot) =>
                timesOverlap(date.day, date.start, date.end, pSlot.day, pSlot.start, pSlot.end),
              ),
            );

            if (hasOverlap && subEv.active === Visibility.Visible) {
              return {
                ...subEv,
                active: Visibility.Hidden,
                hiddenByPriority: true,
              };
            }
            return subEv;
          });

          // Update Event visibility basierend auf SubEvents
          const allHidden = updatedSubEvents.every((se) => se.active === Visibility.Hidden);
          const allVisible = updatedSubEvents.every((se) => se.active === Visibility.Visible);

          return {
            ...ev,
            events: updatedSubEvents,
            active: allHidden ? Visibility.Hidden : allVisible ? Visibility.Visible : Visibility.Partial,
          };
        }),
      );
      toast.success("Alle überlappenden Termine wurden ausgeblendet");
    },
    [events, timesOverlap],
  );

  const prioritizeSubEvent = useCallback(
    (eventId: number, subName: string) => {
      const targetEvent = events.find((ev) => ev.id === eventId);
      if (!targetEvent) return;

      const targetSubEvent = targetEvent.events.find((se) => se.name === subName);
      if (!targetSubEvent || targetSubEvent.active === Visibility.Hidden) return;

      // Toggle: Wenn bereits priorisiert, stelle vorherigen Zustand wieder her
      if (targetSubEvent.prioritized) {
        setEvents((events) =>
          events.map((ev) => {
            // Update das Event mit der priorisierten Gruppe
            if (ev.id === eventId) {
              return {
                ...ev,
                events: ev.events.map((se) => (se.name === subName ? { ...se, prioritized: false } : se)),
              };
            }

            // Blende alle SubEvents wieder ein, die durch DIESES SubEvent ausgeblendet wurden
            const restoredSubEvents = ev.events.map((subEv) => {
              const wasHiddenByThisSubEvent =
                subEv.hiddenByPriority &&
                subEv.dates.some((date) =>
                  targetSubEvent.dates.some((targetDate) =>
                    timesOverlap(date.day, date.start, date.end, targetDate.day, targetDate.start, targetDate.end),
                  ),
                );

              if (wasHiddenByThisSubEvent) {
                // Prüfe ob es noch andere priorisierte Events/SubEvents gibt
                const stillHiddenByOthers = events.some(
                  (otherEv) =>
                    otherEv.events.some(
                      (otherSubEv) =>
                        (otherEv.id !== eventId || otherSubEv.name !== subName) &&
                        otherSubEv.prioritized &&
                        otherSubEv.active === Visibility.Visible &&
                        otherSubEv.dates.some((otherDate) =>
                          subEv.dates.some((date) =>
                            timesOverlap(date.day, date.start, date.end, otherDate.day, otherDate.start, otherDate.end),
                          ),
                        ),
                    ) ||
                    (otherEv.prioritized &&
                      otherEv.id !== eventId &&
                      otherEv.events.some(
                        (otherSubEv) =>
                          otherSubEv.active === Visibility.Visible &&
                          otherSubEv.dates.some((otherDate) =>
                            subEv.dates.some((date) =>
                              timesOverlap(
                                date.day,
                                date.start,
                                date.end,
                                otherDate.day,
                                otherDate.start,
                                otherDate.end,
                              ),
                            ),
                          ),
                      )),
                );

                if (!stillHiddenByOthers) {
                  return {
                    ...subEv,
                    active: Visibility.Visible,
                    hiddenByPriority: false,
                  };
                }
              }
              return subEv;
            });

            // Update Event visibility
            const allHidden = restoredSubEvents.every((se) => se.active === Visibility.Hidden);
            const allVisible = restoredSubEvents.every((se) => se.active === Visibility.Visible);

            return {
              ...ev,
              events: restoredSubEvents,
              active: allHidden ? Visibility.Hidden : allVisible ? Visibility.Visible : Visibility.Partial,
            };
          }),
        );
        toast.info("Priorisierung aufgehoben");
        return;
      }

      const prioritySlots = targetSubEvent.dates;

      // Setze SubEvent als priorisiert und blende überlappende aus
      setEvents((events) =>
        events.map((ev) => {
          const updatedSubEvents = ev.events.map((subEv) => {
            // Setze das zu priorisierende SubEvent
            if (ev.id === eventId && subEv.name === subName) {
              return { ...subEv, prioritized: true };
            }

            // Prüfe ob dieses SubEvent mit dem Priority-SubEvent überlappt
            const hasOverlap = subEv.dates.some((date) =>
              prioritySlots.some((pSlot) =>
                timesOverlap(date.day, date.start, date.end, pSlot.day, pSlot.start, pSlot.end),
              ),
            );

            if (hasOverlap && subEv.active === Visibility.Visible) {
              return {
                ...subEv,
                active: Visibility.Hidden,
                hiddenByPriority: true,
              };
            }
            return subEv;
          });

          // Update Event visibility basierend auf SubEvents
          const allHidden = updatedSubEvents.every((se) => se.active === Visibility.Hidden);
          const allVisible = updatedSubEvents.every((se) => se.active === Visibility.Visible);

          return {
            ...ev,
            events: updatedSubEvents,
            active: allHidden ? Visibility.Hidden : allVisible ? Visibility.Visible : Visibility.Partial,
          };
        }),
      );
      toast.success("Alle überlappenden Termine wurden ausgeblendet");
    },
    [events, timesOverlap],
  );

  const changeEventIcsName = useCallback((id: number, icsName: string) => {
    setEvents((events) => events.map((ev) => (ev.id === id ? { ...ev, icsName } : ev)));
  }, []);

  const changeSubEventIcsName = useCallback((eventId: number, subName: string, icsName: string) => {
    setEvents((events) =>
      events.map((ev) =>
        ev.id === eventId
          ? {
              ...ev,
              events: ev.events.map((sub) => (sub.name === subName ? { ...sub, icsName } : sub)),
            }
          : ev,
      ),
    );
  }, []);

  return {
    events,
    setEvents,
    addEvent,
    addSearchResult,
    addModuleByID,
    toggleEvent,
    removeEvent,
    toggleSubEvent,
    clearAllEvents,
    changeEventColor,
    prioritizeEvent,
    prioritizeSubEvent,
    changeEventIcsName,
    changeSubEventIcsName,
  };
}
