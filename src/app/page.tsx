"use client";

import { useState, useEffect, useRef } from "react";
import WeeklyCalender, { Entry } from "@/components/weeklycalender";
import AddEventModal from "@/components/add-event-modal";
import EventInfoModal from "@/components/event-info-modal";
import { EventList } from "@/components/event-list";
import { SearchDialog } from "@/components/search-dialog";
import { StundenplanControls } from "@/components/stundenplan-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus } from "lucide-react";
import { useEvents } from "@/hooks/use-events";
import { useSearch } from "@/hooks/use-search";
import { useStundenplan } from "@/hooks/use-stundenplan";
import { Visibility, SearchResult, Event } from "@/types/planner";
import { DAYS } from "@/lib/planner-utils";
import { NewEventData } from "@/components/add-event-modal";
import Image from "next/image";
import betterStine from "/public/icons/betterstine.svg";
import logo from "/public/stineultras.svg";
import { createShareLink, exportICS, importStundeplan } from "@/lib/import-export";

type Semester = {
  id: number;
  name: string;
  isSelectable: boolean;
};

export default function Planer() {
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(
    null,
  );
  const isLoadingStundenplan = useRef(false);

  const {
    stundenplaene,
    currentStundenplan,
    currentStundenplanId,
    createStundenplan,
    loadStundenplan,
    saveCurrentStundenplan,
    deleteStundenplan,
    renameStundenplan,
  } = useStundenplan();

  const {
    events,
    addEvent,
    addSearchResult,
    toggleEvent,
    removeEvent,
    toggleSubEvent,
    clearAllEvents,
    changeEventColor,
    setEvents,
    prioritizeEvent,
    prioritizeSubEvent,
  } = useEvents([]);

  const { search, setSearch, searchedEvents, isSearching, clearSearch } =
    useSearch(selectedSemesterId);

  // Lade Semester beim Start
  useEffect(() => {
    async function loadSemesters() {
      try {
        const response = await fetch("/api/semesters");
        const data = await response.json();
        setSemesters(data);
      } catch (error) {
        console.error("Fehler beim Laden der Semester:", error);
      }
    }
    loadSemesters();
  }, []);

  // Erstelle automatisch einen Stundenplan, wenn keiner existiert
  useEffect(() => {
    if (
      semesters.length > 0 &&
      stundenplaene.length === 0 &&
      !currentStundenplan
    ) {
      const neuestesSemester = semesters[0];
      createStundenplan(
        `Stundenplan ${neuestesSemester.name}`,
        neuestesSemester.id,
      );
    }
  }, [semesters, stundenplaene.length, currentStundenplan, createStundenplan]);

  // Lade Events aus dem aktuellen Stundenplan
  useEffect(() => {
    if (currentStundenplan) {
      isLoadingStundenplan.current = true;
      setEvents(currentStundenplan.events);
      setSelectedSemesterId(currentStundenplan.semesterId);
      // Reset nach einem Tick, damit Speichern wieder aktiviert wird
      setTimeout(() => {
        isLoadingStundenplan.current = false;
      }, 0);
    } else {
      setEvents([]);
    }
  }, [currentStundenplan, setEvents]);

  // Speichere Events automatisch, wenn sie sich ändern
  useEffect(() => {
    // Nur speichern wenn wir nicht gerade laden
    if (
      currentStundenplan &&
      events.length >= 0 &&
      !isLoadingStundenplan.current
    ) {
      saveCurrentStundenplan(events);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]); // Nur events, nicht saveCurrentStundenplan um Endlosschleife zu vermeiden

  // Synchronisiere Semester mit Stundenplan
  useEffect(() => {
    if (
      currentStundenplan &&
      selectedSemesterId !== currentStundenplan.semesterId
    ) {
      // Wenn ein anderes Semester gewählt wird, erstelle neuen Stundenplan
      if (selectedSemesterId) {
        const semesterName =
          semesters.find((s) => s.id === selectedSemesterId)?.name ||
          "Unbekannt";
        createStundenplan(`Stundenplan ${semesterName}`, selectedSemesterId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSemesterId]);

  // Setze Suche zurück wenn Dialog geschlossen wird
  useEffect(() => {
    if (!showSearchDialog) {
      clearSearch();
    }
  }, [showSearchDialog, clearSearch]);

  // Lade Stundenplan aus URL-Parameter (nur einmalig beim Start)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("data")) return; 
    importStundeplan(
      createStundenplan,
      addEvent,
      addSearchResult,
      toggleSubEvent,
      changeEventColor,
      params
    );
  }, []);

  const handleShare = () => {
    return createShareLink(currentStundenplan!);
  }

  const handleExport = () => {
    const icsContent = exportICS(events, semesters.find(s => s.id === currentStundenplan?.semesterId)?.name || "");
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentStundenplan?.name || "stundenplan"}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadStundenplan = (id: string) => {
    loadStundenplan(id);
  };

  const handleCreateStundenplan = (name: string, semesterId: number) => {
    createStundenplan(name, semesterId);
  };

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

  const showEventDetails = (id: number) => {
    const event = events.find((ev) => ev.id === id);
    if (event) {
      setSelectedEvent(event);
      setShowEventDetailsModal(true);
    }
  };

  // Konvertiere Events zu Calendar Entries
  // Dedupliziere Termine: Nehme nur einen Termin pro Kombination aus day + start + end + text
  const allEntrys: Entry[] = events.flatMap((ev) =>
    ev.events
      .filter((subEv) => subEv.active === Visibility.Visible)
      .flatMap((subEv) =>
        subEv.dates.map((d) => ({
          id: ev.id,
          text: subEv.shortname,
          day: d.day,
          start: d.start,
          end: d.end,
          room: d.room,
          bgcolor: ev.bgcolor,
          textcolor: ev.textcolor,
        })),
      ),
  );

  // Dedupliziere basierend auf day + start + end + text (nur eine Instanz jedes wöchentlichen Termins)
  const uniqueEntryMap = new Map<string, Entry>();
  allEntrys.forEach((entry) => {
    const key = `${entry.text}-${entry.day}-${entry.start}-${entry.end}`;
    if (!uniqueEntryMap.has(key)) {
      uniqueEntryMap.set(key, entry);
    }
  });
  const entrys: Entry[] = Array.from(uniqueEntryMap.values());

  return (
    <main className="flex flex-col w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <div className="w-full border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <Image src={betterStine} alt="STiNE Ultras Logo" width={64} />
            </div>
            <div>
              <Image src={logo} alt="STiNE Ultras" height={64} />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-[#0261bb] bg-clip-text text-transparent">
                Stundenplan Editor
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Erstelle deinen individuellen Stundenplan
              </p>
            </div>
          </div>
          {/* Stundenplan Controls */}
          <div className="flex items-center gap-4">
            <StundenplanControls
              stundenplaene={stundenplaene}
              currentStundenplanId={currentStundenplanId}
              currentSemesterId={selectedSemesterId}
              semesters={semesters}
              onLoadStundenplan={handleLoadStundenplan}
              onCreateStundenplan={handleCreateStundenplan}
              onDeleteStundenplan={deleteStundenplan}
              onRenameStundenplan={renameStundenplan}
              onShareStundenplan={handleShare}
              onExportStundenplan={handleExport}
            />
          </div>
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
              variant="default"
              disabled={!currentStundenplan}
              title="Durchsuche das Vorlesungsverzeichnis nach Veranstaltungen">
              <Search className="h-4 w-4 mr-2" />
              Vorlesungsverzeichnis durchsuchen
            </Button>
            <Button
              onClick={() => setShowAddEventModal(true)}
              className="w-full h-12"
              variant="outline"
              disabled={!currentStundenplan}
              title="Füge eine eigene Veranstaltung oder einen Termin hinzu">
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
            onShowInfo={showEventDetails}
            onColorChange={changeEventColor}
            onPrioritizeEvent={prioritizeEvent}
            onPrioritizeSubEvent={prioritizeSubEvent}
          />
        </aside>

        {/* Rechte Seite: Stundenplan */}
        <section className="flex-1 flex flex-col min-w-0">
          <Card className="shadow-md flex-1 flex flex-col overflow-hidden">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-xl">Dein Stundenplan</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-6 pt-0 overflow-auto">
              <WeeklyCalender days={DAYS} entrys={entrys} />
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Modal für neues Event */}
      <AddEventModal
        open={showAddEventModal}
        onAdd={handleAddEvent}
        onCancel={() => setShowAddEventModal(false)}
      />

      {/* Modal für Event-Details */}
      <EventInfoModal
        open={showEventDetailsModal}
        event={selectedEvent}
        onClose={() => setShowEventDetailsModal(false)}
      />

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
