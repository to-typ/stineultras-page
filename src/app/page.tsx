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

    // Stundenplan erstellen
    const name = params.get("name");
    const sem = params.get("sem");
    createStundenplan(name || "Importierter Stundenplan", sem ? parseInt(sem) : 0);

    // Events hinzufügen
    const data = params.get("data");
    if (data) {
      (async () => {
        const ownEvents: NewEventData[] = [];  
        const ownEventVisibility: string[] = [];
        const searchResults: SearchResult[] = [];
        const searchResultVisibility: string[] = [];
        const searchResultColors: string[] = [];
        
        for (const evStr of data.split("|")) {
          if (!evStr) continue;
          
          if (evStr.startsWith("*")) {
            // Eigenes Event
            const [namePart, visPart, colorPart, subPart, datesPart] = evStr
              .substring(1)
              .split("-");
            
            ownEvents.push({
              name: namePart,
              color: colorPart,
              groups: subPart.split(";").map((subStr, index) => ({
                name: `${subStr}`,
                dates: [(() => {
                  const d = datesPart.split(";")[index];
                  const [day, start, end] = d.split(",");
                  return { day, start, end };
                })()],
              })),
            });
            ownEventVisibility.push(visPart);
          } else {
            // Normales Event
            const [idPart, visPart, colorPart] = evStr.split("-");
            const url = "/api/search?id=" + idPart;
            const response = await fetch(url);
            const result = await response.json();
            searchResults.push(result);
            searchResultVisibility.push(visPart);
            searchResultColors.push(colorPart);
          }
        }
        
        // Alle Events auf einmal hinzufügen 
        ownEvents.forEach((e, index) => {
          const event = addEvent(e);
          if(event) {
            for(let i = 0; i < e.groups.length; i++) {
              const vis = ownEventVisibility[index][i];
              if(vis === "0") toggleSubEvent(event, e.groups[i]?.name); 
            }
          }
        });
        searchResults.forEach((r, index) => {
          const event = addSearchResult(r);
          if (index < searchResultColors.length && searchResultColors[index]) {
            changeEventColor(r.veranstaltung.id, searchResultColors[index]);
          }
          if(event && r.uebungsgruppen) {
            for(let i = 0; i < r.uebungsgruppen.length; i++) {
              const vis = searchResultVisibility[index][i];
              if(vis === "0") toggleSubEvent(event, r.uebungsgruppen[i].uebungsgruppe.name); 
            }
          }
        });
      })();
    }
  }, []);

  const handleShare = () => {
    const url = `www.stineultras.de?`;
    const name = currentStundenplan?.name;
    const sem = currentStundenplan?.semesterId;
    const eventdata = currentStundenplan?.events
      .map((e) => {
          if(e.info != null) {
            return e.id + "-" + e.events.map((sub) => sub.active === Visibility.Visible ? "1" : "0").join("") 
            + "-" + e.bgcolor;
          } else {
            
            console.log(e.events.map((sub) => sub.dates.map((d) => d.day + "," + d.start + "," + d.end).join(",")).join(";"));
            return "*" + e.name + "-" + e.events.map((sub) => sub.active === Visibility.Visible ? "1" : "0").join("")
            + "-" + e.bgcolor + "-" + e.events.map((sub) => sub.name).join(";") + "-"
            + e.events.map((sub) => sub.dates.map((d) => d.day + "," + d.start + "," + d.end).join(",")).join(";");
          }
        }
      )
      .join("|");
      console.log(eventdata || "");
      console.log(`${url}name=${encodeURIComponent(name || "")}&sem=${sem}&data=${encodeURIComponent(eventdata || "")}`);
    
    return `${url}name=${encodeURIComponent(name || "")}&sem=${sem}&data=${encodeURIComponent(eventdata || "")}`;
  }

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
