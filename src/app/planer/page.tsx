"use client"

import WeeklyCalender, { Entry } from "@/components/weeklycalender";
import { useState } from "react";

enum Visibility {
    Visible,
    Hidden,
    Partial
}

type Event = {
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

export default function Planer() {
    const [search, setSearch] = useState("");
    const [events, setEvents] = useState(dummyEvents);
    const [showAddEventModal, setShowAddEventModal] = useState(false);
    const [newEventName, setNewEventName] = useState("");
    const [newEventColor, setNewEventColor] = useState("#6366f1");
    const [newEventDates, setNewEventDates] = useState<Array<{type: string, day: string, start: string, end: string}>>([]);

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
        <main className="flex flex-col w-full min-h-screen bg-gray-50">
            <h1 className="text-4xl font-bold text-center mt-10 mb-8">Planer</h1>
            <div className="flex flex-row gap-8 px-8">
                {/* Linke Spalte: Suche + Events */}
                <section className="flex flex-col w-1/4 min-w-[200px]">
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Event suchen..."
                        className="border rounded px-3 py-2 mb-4"
                    />
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
                    
                    <div className="flex flex-col gap-2">
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
        </main>
    );
}