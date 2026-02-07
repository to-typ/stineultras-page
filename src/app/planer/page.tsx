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
        <main className="flex flex-col w-full min-h-screen bg-gray-50">
            <h1 className="text-4xl font-bold text-center mt-10 mb-8">Planer</h1>
            <div className="flex flex-row gap-8 px-8">
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
        </main>
    );
}