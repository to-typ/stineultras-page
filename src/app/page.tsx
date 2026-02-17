"use client";

import { useState, useEffect } from "react";
import WeeklyCalender, { Entry } from "@/components/weeklycalender";
import AddEventModal from "@/components/addeventmodal";
import { EventList } from "@/components/event-list";
import { SearchDialog } from "@/components/search-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, Plus } from "lucide-react";
import { useEvents } from "@/hooks/use-events";
import { useSearch } from "@/hooks/use-search";
import { Visibility, SearchResult } from "@/types/planner";
import { DAYS } from "@/lib/planner-utils";
import { NewEventData } from "@/components/addeventmodal";

const dummyEvents = [
  {
    id: 1,
    name: "Mathe",
    shortname: "Math",
    active: Visibility.Visible,
    bgcolor: "#3b82f6",
    textcolor: "#1e3a8a",
    events: [
      {
        name: "Übung A",
        shortname: "Vorl",
        dates: [
          { day: "Mo", start: "8:00", end: "8:45" },
          { day: "Mo", start: "11:00", end: "12:00" },
          { day: "Mi", start: "8:00", end: "10:00" },
        ],
        active: Visibility.Visible,
      },
      {
        name: "Übung B",
        shortname: "Übg",
        dates: [
          { day: "Fr", start: "8:00", end: "10:00" },
          { day: "Mo", start: "8:45", end: "10:00" },
        ],
        active: Visibility.Visible,
      },
    ],
  },
  {
    id: 2,
    name: "Sport",
    shortname: "Sport",
    active: Visibility.Hidden,
    bgcolor: "#ef4444",
    textcolor: "#7f1d1d",
    events: [
      {
        name: "Training",
        shortname: "Train",
        dates: [
          { day: "Di", start: "14:00", end: "16:00" },
          { day: "Do", start: "14:00", end: "16:00" },
        ],
        active: Visibility.Hidden,
      },
    ],
  },
  {
    id: 3,
    name: "Klausurvorbereitung",
    shortname: "Klausur",
    active: Visibility.Visible,
    bgcolor: "#22c55e",
    textcolor: "#166534",
    events: [
      {
        name: "Lernen",
        shortname: "Lern",
        dates: [{ day: "Mo", start: "8:00", end: "12:00" }],
        active: Visibility.Visible,
      },
    ],
  },
];

export default function Planer() {
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);

  const {
    events,
    addEvent,
    addSearchResult,
    toggleEvent,
    removeEvent,
    toggleSubEvent,
    clearAllEvents,
  } = useEvents(dummyEvents);

  const { search, setSearch, searchedEvents, isSearching, clearSearch } =
    useSearch();

  // Setze Suche zurück wenn Dialog geschlossen wird
  useEffect(() => {
    if (!showSearchDialog) {
      clearSearch();
    }
  }, [showSearchDialog, clearSearch]);

  const handleAddSearchResult = (result: SearchResult) => {
    const success = addSearchResult(result);
    if (success) {
      setShowSearchDialog(false);
    }
  };

  const handleAddEvent = (newEventData: NewEventData) => {
    addEvent(newEventData);
    setShowAddEventModal(false);
  };

  // Konvertiere Events zu Calendar Entries
  const entrys: Entry[] = events.flatMap((ev) =>
    ev.events
      .filter((subEv) => subEv.active === Visibility.Visible)
      .flatMap((subEv) =>
        subEv.dates.map((d) => ({
          id: ev.id,
          text: subEv.shortname,
          day: d.day,
          start: d.start,
          end: d.end,
          bgcolor: ev.bgcolor,
          textcolor: ev.textcolor,
        })),
      ),
  );

  return (
    <main className="flex flex-col w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <div className="w-full border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Stundenplan Editor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Erstelle deinen individuellen Stundenplan
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 flex flex-col lg:flex-row gap-6 flex-1">
        {/* Linke Sidebar: Suche + Events */}
        <aside className="w-full lg:w-96 flex flex-col gap-4">
          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setShowSearchDialog(true)}
              className="w-full h-12"
              variant="default">
              <Search className="h-4 w-4 mr-2" />
              Veranstaltungen durchsuchen
            </Button>
            <Button
              onClick={() => setShowAddEventModal(true)}
              className="w-full h-12"
              variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Eigenes Event hinzufügen
            </Button>
          </div>

          {/* Events Liste */}
          <EventList
            events={events}
            onToggleEvent={toggleEvent}
            onRemoveEvent={removeEvent}
            onToggleSubEvent={toggleSubEvent}
            onClearAll={clearAllEvents}
          />
        </aside>

        {/* Rechte Seite: Stundenplan */}
        <section className="flex-1 flex flex-col">
          <Card className="shadow-md flex-1">
            <CardHeader>
              <CardTitle className="text-xl">Dein Stundenplan</CardTitle>
              <CardDescription>
                Aktive Veranstaltungen im Wochenplan
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <WeeklyCalender days={DAYS} entrys={entrys} />
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Modal für neues Event */}
      {showAddEventModal && (
        <AddEventModal
          onAdd={handleAddEvent}
          onCancel={() => setShowAddEventModal(false)}
        />
      )}

      {/* Dialog für Veranstaltungssuche */}
      <SearchDialog
        open={showSearchDialog}
        onOpenChange={setShowSearchDialog}
        search={search}
        onSearchChange={setSearch}
        searchResults={searchedEvents}
        isSearching={isSearching}
        onSelectResult={handleAddSearchResult}
      />
    </main>
  );
}
