"use client"

import WeeklyCalender, { Entry } from "@/components/weeklycalender";
import { useState } from "react";
import { Veranstaltung, Termin, Uebungsgruppe } from "@prisma/client";

type SearchResult = {
        veranstaltung: Veranstaltung;
        termine: Termin[] | null;
        uebungsgruppen: [
            {
                uebungsgruppe: Uebungsgruppe;
                termine: Termin[];
            }
        ] | null;
    };

enum Visibility {
    Visible,
    Hidden,
    Partial
}

export type Event = {
    id: number;
    name: string;
    active: Visibility;
    bgcolor: string;
    textcolor: string;
    events: {
        name: string;
        active: Visibility;
        dates: {
            day: string;
            start: string;
            end: string;
        }[];
    }[];
};

const dummyEvents: Event[] = [
    { id: 1, name: "Mathe", active: Visibility.Visible, bgcolor: "#3b82f6", textcolor: "#1e3a8a",
        events: [
        {name: "Vorlesung", dates: [
            {day: "Mo", start: "8:00", end: "8:45"}, 
            {day: "Mo", start: "11:00", end: "12:00"}, 
            {day: "Mi", start: "8:00", end: "10:00"}], 
        active: Visibility.Visible},
        {name: "Übung", dates: [
            {day: "Fr", start: "8:00", end: "10:00"},
            {day: "Mo", start: "8:45", end: "10:00"}],
        active: Visibility.Visible}
    ]},
    { id: 2, name: "Sport", active: Visibility.Hidden, bgcolor: "#ef4444", textcolor: "#7f1d1d",
        events: [
        {name: "Training", dates: [
            {day: "Di", start: "14:00", end: "16:00"}, 
            {day: "Do", start: "14:00", end: "16:00"}], 
        active: Visibility.Hidden}
    ]},
    { id: 3, name: "Klausurvorbereitung", active: Visibility.Visible, bgcolor: "#22c55e", textcolor: "#166534",
        events: [
        {name: "Lernen", dates: [
            {day: "Mo", start: "8:00", end: "12:00"}],
        active: Visibility.Visible}
    ]},
];

const days = ["Mo", "Di", "Mi", "Do", "Fr"];

function getInterval(termine: Termin[]) {
    const tagDate = new Date(termine[0].tag);
    const startDate = new Date(termine[0].startZeit);
    const endDate = new Date(termine[0].endZeit);

    // Deutsche Wochentage
    const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    const tag = days[tagDate.getDay()];

    function toTimeString(date: Date) {
        return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", hour12: false });
    }
    const start = toTimeString(startDate);
    const end = toTimeString(endDate);

    // Debug
    console.log({tag, start, end});
    return {tag, start, end};
}

export default function Planer() {
    const [search, setSearch] = useState("");
    const [searchedEvents, setSearchedEvents] = useState<SearchResult[]>([]);
    const [events, setEvents] = useState(dummyEvents);
    const [showAddEventModal, setShowAddEventModal] = useState(false);
    const [newEventName, setNewEventName] = useState("");
    const [newEventColor, setNewEventColor] = useState("#6366f1");
    const [newEventDates, setNewEventDates] = useState<Array<{type: string, day: string, start: string, end: string}>>([
    ]);
    const [editingEventId, setEditingEventId] = useState<number | null>(null);
    const [editingEventName, setEditingEventName] = useState("");
    const [editingEventColor, setEditingEventColor] = useState("#6366f1");
    const [editingEventDates, setEditingEventDates] = useState<Array<{type: string, day: string, start: string, end: string}>>([
    ]);

    const handleAddEvent = () => {
        if (newEventName.trim() === "") return;
        if (newEventDates.length === 0) return;
        
        const textColor = getContrastColor(newEventColor);
        
        const newEvent: Event = {
            id: Math.max(...events.map(e => e.id), 0) + 1,
            name: newEventName,
            active: Visibility.Visible,
            bgcolor: newEventColor,
            textcolor: textColor,
            events: newEventDates.map(d => ({
                name: d.type,
                active: Visibility.Visible,
                dates: [{
                    day: d.day,
                    start: d.start,
                    end: d.end
                }]
            }))
        };
        
        setEvents([...events, newEvent]);
        setNewEventName("");
        setNewEventColor("#6366f1");
        setNewEventDates([]);
        setShowAddEventModal(false);
    };

    const handleAddDate = () => {
        setNewEventDates([...newEventDates, {type: "", day: "Mo", start: "08:00", end: "10:00"}]);
    };

    const handleRemoveDate = (index: number) => {
        setNewEventDates(newEventDates.filter((_, i) => i !== index));
    };

    const handleDateChange = (index: number, field: string, value: string) => {
        const updated = [...newEventDates];
        updated[index] = {...updated[index], [field]: value};
        setNewEventDates(updated);
    };

    const getContrastColor = (hexColor: string): string => {
        // Hex zu RGB konvertieren
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        
        // Helligkeit berechnen (Luminanz-Formel)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Wenn Farbe hell ist, dunklere Version zurückgeben, sonst deutlich hellere
        if (luminance > 0.5) {
            // Dunklere Version (70% der Originalwerte)
            const darkR = Math.round(r * 0.7);
            const darkG = Math.round(g * 0.7);
            const darkB = Math.round(b * 0.7);
            return `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;
        } else {
            // Deutlich hellere Version (250% der Originalwerte, max 255)
            const lightR = Math.min(255, Math.round(r * 2.5));
            const lightG = Math.min(255, Math.round(g * 2.5));
            const lightB = Math.min(255, Math.round(b * 2.5));
            return `#${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`;
        }
    };

    const handleOpenAddEventModal = () => {
        setShowAddEventModal(true);
        setNewEventDates([{type: "", day: "Mo", start: "08:00", end: "10:00"}]);
    };

    const handleOpenEditEventModal = (eventId: number) => {
        const event = events.find(e => e.id === eventId);
        if (!event) return;
        
        setEditingEventId(eventId);
        setEditingEventName(event.name);
        setEditingEventColor(event.bgcolor);
        setEditingEventDates(
            event.events.flatMap(subEv => 
                subEv.dates.map(d => ({
                    type: subEv.name,
                    day: d.day,
                    start: d.start,
                    end: d.end
                }))
            )
        );
    };

    const handleSaveEditEvent = () => {
        if (!editingEventId || editingEventName.trim() === "" || editingEventDates.length === 0) return;
        
        const textColor = getContrastColor(editingEventColor);
        
        setEvents(events.map(ev => 
            ev.id === editingEventId
                ? {
                    ...ev,
                    name: editingEventName,
                    bgcolor: editingEventColor,
                    textcolor: textColor,
                    events: editingEventDates.map(d => ({
                        name: d.type,
                        active: Visibility.Visible,
                        dates: [{day: d.day, start: d.start, end: d.end}]
                    }))
                  }
                : ev
        ));
        
        setEditingEventId(null);
        setEditingEventName("");
        setEditingEventColor("#6366f1");
        setEditingEventDates([]);
    };

    const handleEditDateChange = (index: number, field: string, value: string) => {
        const updated = [...editingEventDates];
        updated[index] = {...updated[index], [field]: value};
        setEditingEventDates(updated);
    };

    const handleAddEditDate = () => {
        setEditingEventDates([...editingEventDates, {type: "", day: "Mo", start: "08:00", end: "10:00"}]);
    };

    const handleRemoveEditDate = (index: number) => {
        setEditingEventDates(editingEventDates.filter((_, i) => i !== index));
    };

    const handleToggle = (id: number) => {
        setEvents(events => events.map(ev => ev.id === id ? { 
            ...ev, active: ev.active === Visibility.Visible ? Visibility.Hidden : Visibility.Visible,
            events: ev.events.map(subEv => 
                    ({ ...subEv, active: ev.active === Visibility.Visible ? Visibility.Hidden : Visibility.Visible })
                )
        } : ev));
    };

    const handleRemove = (id: number) => {
        setEvents(events => events.filter(ev => ev.id !== id));
    };

    const handleToggleSub = (eventId: number, subName: string) => {
        setEvents(events => events.map(ev => {
            if (ev.id !== eventId) return ev;
            const switchState = ev.events.map(subEv => subEv.name === subName ? subEv.active === Visibility.Visible ? Visibility.Hidden : Visibility.Visible : subEv.active);
            return {
                ...ev,
                events: ev.events.map(subEv =>
                    subEv.name === subName
                        ? { ...subEv, active: subEv.active === Visibility.Visible ? Visibility.Hidden : Visibility.Visible }
                        : subEv
                ),
                active: switchState.every(state => state === Visibility.Visible) ? Visibility.Visible : switchState.every(state => state === Visibility.Hidden) ? Visibility.Hidden : Visibility.Partial,

            };
        }));
    };

    const searchEvent = async() => {
        const searchParam = search.trim().toLowerCase(); 
        if (searchParam === "") return;
        const response = await fetch('/api/search?search=' + encodeURIComponent(searchParam));
        const result = await response.json();
        console.log(result);
        setSearchedEvents(result);
    }

    const entrys: Entry[] = events        
        .flatMap(ev =>
            ev.events
                .filter(subEv => subEv.active === Visibility.Visible)
                .flatMap(subEv =>
                    subEv.dates.map(d => ({
                        id: ev.id,
                        text: subEv.name,
                        day: d.day,
                        start: d.start,
                        end: d.end,
                        bgcolor: ev.bgcolor,
                        textcolor: ev.textcolor
                    }))
                )
        );

    // TODO: API-Aufruf für Suche

    return (
        <main className="flex flex-col w-full h-screen bg-gray-50">
            <h1 className="text-4xl font-bold text-center mt-10 mb-8">Planer</h1>
            <div className="flex flex-row gap-8 px-8 flex-1 overflow-hidden">
                {/* Linke Spalte: Suche + Events */}
                <section className="flex flex-col w-1/4 min-w-[200px]">
                    <div className="flex flex-row gap-2 mb-2">
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Event suchen..."
                            className="border rounded px-3 py-2 flex-1"
                        />
                        <button
                            className={`px-2 py-1 rounded text-xs ${search.length > 0 ? "bg-green-200" : "bg-gray-200"}`}
                            style={{ minWidth: 70 }}
                            onClick={() => {
                                searchEvent();
                                setSearch("");
                            }}
                        >{"Suchen"}
                        </button>
                    </div>
                    {searchedEvents.length > 0 && (
                        <div className="mb-4 bg-blue-50 border border-blue-200 rounded p-2">
                            <div className="font-semibold mb-2">Suchergebnisse:</div>
                            <ul className="flex flex-col gap-1">
                                {searchedEvents.map(ev => (
                                    <li
                                        key={ev.veranstaltung.id + '-' + ev.veranstaltung.name}
                                        className="text-sm cursor-pointer hover:bg-blue-100 rounded px-1"
                                        onClick={() => {
                                            if (!ev.termine || ev.termine.length === 0) return;
                                            const interval = getInterval(ev.termine);
                                            setEvents(events => [
                                                ...events,
                                                {
                                                    id: ev.veranstaltung.id,
                                                    name: ev.veranstaltung.name,
                                                    active: Visibility.Visible,
                                                    bgcolor: '#a5b4fc',
                                                    textcolor: '#1e3a8a',
                                                    events: [
                                                        {
                                                            name: ev.veranstaltung.name,
                                                            active: Visibility.Visible,
                                                            dates: [
                                                                {
                                                                    day: interval.tag as unknown as string,
                                                                    start: interval.start as unknown as string,
                                                                    end: interval.end as unknown as string
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]);
                                        }}
                                    >
                                        <span className="font-bold">{ev.veranstaltung.name}</span> 
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <button
                        className={`px-2 py-1 rounded text-xs ${events.length > 0 ? "bg-green-200" : "bg-gray-200"} mb-4`}
                        onClick={handleOpenAddEventModal}
                    >{"Event hinzufügen"}
                    </button>
                    <button
                        className={`px-2 py-1 rounded text-xs ${events.length > 0 ? "bg-red-200" : "bg-gray-200"} mb-4`}
                        onClick={() => setEvents([])}
                    >{"Alle löschen"}
                    </button>
                    
                    <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-2">
                        {events.map(ev => (
                            <div key={ev.id} className="bg-white rounded shadow px-3 py-2 mb-2">
                                <div className="flex items-center justify-between">
                                    <span className={ev.active === Visibility.Hidden ? "line-through text-gray-400 font-semibold" : "font-semibold"}>{ev.name}</span>
                                    <div className="flex gap-2">
                                        <button
                                            className={`px-2 py-1 rounded text-xs ${ev.active === Visibility.Visible ? "bg-green-200" : ev.active === Visibility.Hidden ?"bg-gray-200" : "bg-yellow-200"}`}
                                            onClick={() => handleToggle(ev.id)}
                                        >{ev.active === Visibility.Visible ? "An" : "Aus"}</button>
                                        <button
                                            className="px-2 py-1 rounded bg-blue-200 text-xs"
                                            onClick={() => handleOpenEditEventModal(ev.id)}
                                        >Bearbeiten</button>
                                        <button
                                            className="px-2 py-1 rounded bg-red-200 text-xs"
                                            onClick={() => handleRemove(ev.id)}
                                        >Entfernen</button>
                                    </div>
                                </div>
                                <div className="ml-2 mt-1 flex flex-col gap-1">
                                    {ev.events.map(subEv => (
                                        <div key={subEv.name} className="flex items-center justify-between">
                                            <span className={subEv.active === Visibility.Visible ? "" : "line-through text-gray-400"}>{subEv.name}</span>
                                            <button
                                                className={`px-2 py-1 rounded text-xs ${subEv.active === Visibility.Visible ? "bg-blue-200" : "bg-gray-200"}`}
                                                onClick={() => handleToggleSub(ev.id, subEv.name)}
                                            >{subEv.active === Visibility.Visible ? "An" : "Aus"}</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Rechte Spalte: Stundenplan */}
                <section className="flex-1 flex flex-col items-center w-3/4">
                    <WeeklyCalender days={days} entrys={entrys} />
                </section>
            </div>

            {/* Modal für neues Event */}
            {showAddEventModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-96 shadow-lg flex flex-col h-[600px]">
                        <div className="p-6 pb-4">
                            <h2 className="text-xl font-bold mb-4">Neues Event hinzufügen</h2>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Event Name</label>
                                <input
                                    type="text"
                                    value={newEventName}
                                    onChange={(e) => setNewEventName(e.target.value)}
                                    placeholder="z.B. Mathe"
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Farbe</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={newEventColor}
                                        onChange={(e) => setNewEventColor(e.target.value)}
                                        className="w-12 h-10 border rounded cursor-pointer"
                                    />
                                    <span className="text-xs text-gray-600">{newEventColor}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold">Termine</label>
                                <button
                                    onClick={handleAddDate}
                                    className="px-2 py-1 rounded bg-green-500 text-white text-xs hover:bg-green-600"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6">
                            {newEventDates.map((date, idx) => (
                                <div key={idx} className="mb-3 p-3 border rounded bg-gray-50">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs font-semibold">Termin {idx + 1}</span>
                                        <button
                                            onClick={() => handleRemoveDate(idx)}
                                            className="px-2 py-1 rounded bg-red-500 text-white text-xs hover:bg-red-600"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    
                                    <input
                                        type="text"
                                        placeholder="Typ (z.B. Vorlesung)"
                                        value={date.type}
                                        onChange={(e) => handleDateChange(idx, "type", e.target.value)}
                                        className="w-full border rounded px-2 py-1 text-xs mb-2"
                                    />
                                    
                                    <select
                                        value={date.day}
                                        onChange={(e) => handleDateChange(idx, "day", e.target.value)}
                                        className="w-full border rounded px-2 py-1 text-xs mb-2"
                                    >
                                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    
                                    <div className="flex gap-2">
                                        <input
                                            type="time"
                                            value={date.start}
                                            onChange={(e) => handleDateChange(idx, "start", e.target.value)}
                                            className="flex-1 border rounded px-2 py-1 text-xs"
                                        />
                                        <input
                                            type="time"
                                            value={date.end}
                                            onChange={(e) => handleDateChange(idx, "end", e.target.value)}
                                            className="flex-1 border rounded px-2 py-1 text-xs"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 pt-4 border-t flex gap-2 justify-end">
                            <button
                                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                                onClick={() => setShowAddEventModal(false)}
                            >
                                Abbrechen
                            </button>
                            <button
                                className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400"
                                onClick={handleAddEvent}
                                disabled={!newEventName.trim() || newEventDates.length === 0}
                            >
                                Hinzufügen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal für Event bearbeiten */}
            {editingEventId !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-96 shadow-lg flex flex-col h-[600px]">
                        <div className="p-6 pb-4">
                            <h2 className="text-xl font-bold mb-4">Event bearbeiten</h2>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Event Name</label>
                                <input
                                    type="text"
                                    value={editingEventName}
                                    onChange={(e) => setEditingEventName(e.target.value)}
                                    placeholder="z.B. Mathe"
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Farbe</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={editingEventColor}
                                        onChange={(e) => setEditingEventColor(e.target.value)}
                                        className="w-12 h-10 border rounded cursor-pointer"
                                    />
                                    <span className="text-xs text-gray-600">{editingEventColor}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold">Termine</label>
                                <button
                                    onClick={handleAddEditDate}
                                    className="px-2 py-1 rounded bg-green-500 text-white text-xs hover:bg-green-600"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6">
                            {editingEventDates.map((date, idx) => (
                                <div key={idx} className="mb-3 p-3 border rounded bg-gray-50">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs font-semibold">Termin {idx + 1}</span>
                                        <button
                                            onClick={() => handleRemoveEditDate(idx)}
                                            className="px-2 py-1 rounded bg-red-500 text-white text-xs hover:bg-red-600"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    
                                    <input
                                        type="text"
                                        placeholder="Typ (z.B. Vorlesung)"
                                        value={date.type}
                                        onChange={(e) => handleEditDateChange(idx, "type", e.target.value)}
                                        className="w-full border rounded px-2 py-1 text-xs mb-2"
                                    />
                                    
                                    <select
                                        value={date.day}
                                        onChange={(e) => handleEditDateChange(idx, "day", e.target.value)}
                                        className="w-full border rounded px-2 py-1 text-xs mb-2"
                                    >
                                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    
                                    <div className="flex gap-2">
                                        <input
                                            type="time"
                                            value={date.start}
                                            onChange={(e) => handleEditDateChange(idx, "start", e.target.value)}
                                            className="flex-1 border rounded px-2 py-1 text-xs"
                                        />
                                        <input
                                            type="time"
                                            value={date.end}
                                            onChange={(e) => handleEditDateChange(idx, "end", e.target.value)}
                                            className="flex-1 border rounded px-2 py-1 text-xs"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 pt-4 border-t flex gap-2 justify-end">
                            <button
                                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                                onClick={() => setEditingEventId(null)}
                            >
                                Abbrechen
                            </button>
                            <button
                                className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400"
                                onClick={handleSaveEditEvent}
                                disabled={!editingEventName.trim() || editingEventDates.length === 0}
                            >
                                Speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}