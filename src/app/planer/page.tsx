"use client"

import { useState } from "react";

type Entry = {
    key: string;
    content: string;
    gridRow: string;
    gridColumn: string;
    position: string;
    bgcolor: string;
    textcolor: string;
    style: React.CSSProperties;
};

enum Visibility {
    Visible,
    Hidden,
    Partiall
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
            start: number;
            end: number;
        }[];
    }[];
};

const dummyEvents: Event[] = [
    { id: 1, name: "Mathe", active: Visibility.Visible, bgcolor: "#3b82f6", textcolor: "#1e3a8a",
        events: [
        {name: "Vorlesung", dates: [
            {day: "Mo", start: 8, end: 10}, 
            {day: "Mi", start: 8, end: 10}], 
        active: Visibility.Visible},
        {name: "Übung", dates: [
            {day: "Fr", start: 10, end: 12}],
        active: Visibility.Visible}
    ]},
    { id: 2, name: "Sport", active: Visibility.Hidden, bgcolor: "#ef4444", textcolor: "#7f1d1d",
        events: [
        {name: "Training", dates: [
            {day: "Di", start: 14, end: 16}, 
            {day: "Do", start: 14, end: 16}], 
        active: Visibility.Hidden}
    ]},
    { id: 3, name: "Klausurvorbereitung", active: Visibility.Visible, bgcolor: "#22c55e", textcolor: "#166534",
        events: [
        {name: "Lernen", dates: [
            {day: "Mo", start: 8, end: 12}],
        active: Visibility.Visible}
    ]},
];

const days = ["Mo", "Di", "Mi", "Do", "Fr"];
const timeSlots = Array.from({ length: 22 }, (_, i) => {
    const hour = 8 + Math.floor(i / 2);
    const min = i % 2 === 0 ? 0 : 30;
    return { hour, min, label: `${hour.toString().padStart(2, "0")}:${min === 0 ? "00" : "30"}` };
});



export default function Planer() {
    const [search, setSearch] = useState("");
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
                active: switchState.every(state => state === Visibility.Visible) ? Visibility.Visible : switchState.every(state => state === Visibility.Hidden) ? Visibility.Hidden : Visibility.Partiall,

            };
        }));
    };

    const entrys: Entry[] = events
        .flatMap(ev =>
            ev.events
                .filter(subEv => subEv.active === Visibility.Visible)
                .flatMap(subEv =>
                    subEv.dates.map(d => {
                        const dayIdx = days.indexOf(d.day);
                        if (dayIdx === -1) return null;
                        const startSlotIdx = timeSlots.findIndex(slot => slot.hour + slot.min / 60 >= d.start);
                        const endSlotIdx = timeSlots.findIndex(slot => slot.hour + slot.min / 60 >= d.end);
                        if (startSlotIdx === -1 || endSlotIdx === -1) return null;
                        return {
                            key: ev.id + '-' + subEv.name + '-' + d.day + '-' + d.start,
                            content: subEv.name,
                            gridRow: `${startSlotIdx + 2} / ${endSlotIdx + 2}`,
                            gridColumn: (dayIdx + 2).toString(),
                            position: "1/1",
                            bgcolor: ev.bgcolor,
                            textcolor: ev.textcolor,
                            style: {}
                        };
                    }).filter(Boolean) as Entry[]
                )
        );

    for (const entry of entrys) {
        for (const otherEntry of entrys) {
            if (entry === otherEntry) continue;
            if (entry.gridColumn === otherEntry.gridColumn) {
                const [entryStart, entryEnd] = entry.gridRow.split("/").map(Number);
                const [otherStart, otherEnd] = otherEntry.gridRow.split("/").map(Number);
                if (entryStart < otherEnd && entryEnd > otherStart) {
                    // Überlappung erkannt, beide Einträge leicht verschieben
                    entry.position = "1/2";
                    otherEntry.position = "2/2";
                } else {
                    entry.position = "1/1";
                    otherEntry.position = "1/1";
                }
            }
        }   
    }

    console.log(entrys);
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
                    <div className="w-full overflow-x-auto">
                        <div
                            className="grid"
                            style={{
                                gridTemplateColumns: `80px repeat(${days.length}, 1fr)`,
                                gridTemplateRows: `40px repeat(${timeSlots.length}, 32px)`
                            }}
                        >
                            {/* Header */}
                            <div className="border bg-gray-100 flex items-center justify-center font-semibold" style={{gridRow: 1, gridColumn: 1}}>Zeit</div>
                            {days.map((day, i) => (
                                <div
                                    key={day}
                                    className="border bg-gray-100 flex items-center justify-center font-semibold"
                                    style={{gridRow: 1, gridColumn: i + 2}}
                                >
                                    {day}
                                </div>
                            ))}
                            {/* Zeitspalten */}
                            {timeSlots.map((slot, rowIdx) => (
                                <div
                                    key={slot.label}
                                    className="border bg-gray-50 flex items-center justify-center text-sm font-semibold"
                                    style={{gridRow: rowIdx + 2, gridColumn: 1}}
                                >
                                    {slot.label}
                                </div>
                            ))}

                            {days.map((day, i) => (
                                timeSlots.map((slot, rowIdx) => (
                                <div
                                    key={slot.label}
                                    className="border bg-gray-50 flex items-center justify-center text-sm font-semibold"
                                    style={{gridRow: rowIdx + 2, gridColumn: i + 2}}
                                >
                                </div>
                            ))))}


                            {/* Eventfelder */}
                            {entrys.map(entry => (
                                <div
                                    key={entry.key}
                                    className={`rounded px-1 flex items-center justify-center text-sm font-semibold`}
                                    style={{
                                        position: "relative",
                                        gridRow: entry.gridRow,
                                        gridColumn: entry.gridColumn,
                                        zIndex: entry.position === "1/2" ? 3 : 2,
                                        width: entry.position === "1/2" || entry.position === "2/2" ? "50%" : "100%",
                                        left: entry.position === "1/2" ? "0" : entry.position === "2/2" ? "50%" : "0",
                                        backgroundColor: entry.bgcolor,
                                        color: entry.textcolor,
                                        ...entry.style
                                    }}
                                >
                                    {entry.content}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}