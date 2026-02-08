import React, { useState } from "react";

const days = ["Mo", "Di", "Mi", "Do", "Fr"];

export type NewEventData = {
    name: string;
    color: string;
    date: { day: string; start: string; end: string };
};

type AddEventModalProps = {
    onAdd: (data: NewEventData) => void;
    onCancel: () => void;
};

export default function AddEventModal({ onAdd, onCancel }: AddEventModalProps) {
    const [name, setName] = useState("");
    const [color, setColor] = useState("#6366f1");
    const [date, setDate] = useState({ day: "Mo", start: "08:00", end: "10:00" });

    const handleDateChange = (field: string, value: string) => {
        setDate({ ...date, [field]: value });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-96 shadow-lg flex flex-col h-80">
                <div className="p-6 pb-4">
                    <h2 className="text-xl font-bold mb-4">Event hinzufügen</h2>
                    <div className="flex mb-4">
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Name"
                            className="w-3/4 border rounded px-3 py-2"
                        />
                        <input
                            type="color"
                            value={color}
                            onChange={e => setColor(e.target.value)}
                            className="w-1/4 h-10 border rounded cursor-pointer"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-6">
                    <select
                        value={date.day}
                        onChange={e => handleDateChange("day", e.target.value)}
                        className="w-full border rounded px-2 py-1 text-xs mb-2"
                    >
                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <div className="flex gap-2">
                        <input
                            type="time"
                            value={date.start}
                            onChange={e => handleDateChange("start", e.target.value)}
                            className="flex-1 border rounded px-2 py-1 text-xs"
                        />
                        <input
                            type="time"
                            value={date.end}
                            onChange={e => handleDateChange("end", e.target.value)}
                            className="flex-1 border rounded px-2 py-1 text-xs"
                        />
                    </div>
                </div>
                <div className="p-6 pt-4 border-t flex gap-2 justify-end">
                    <button
                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                        onClick={onCancel}
                    >
                        Abbrechen
                    </button>
                    <button
                        className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400"
                        onClick={() => {
                            if (name.trim()) onAdd({ name, color, date });
                        }}
                        disabled={!name.trim()}
                    >
                        Hinzufügen
                    </button>
                </div>
            </div>
        </div>
    );
}