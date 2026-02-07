"use client";

type Field = {
    key: string;
    content: string;
    gridRow: string;
    gridColumn: string;
    position: string;
    bgcolor: string;
    textcolor: string;
    style: React.CSSProperties;
};

export type Entry = {
    id: number;
    text: string;
    day: string;
    start: number;
    end: number;
    bgcolor: string;
    textcolor: string;
};

export default function WeeklyCalender({days, entrys}: {days: string[], entrys: Entry[]}) {
 
    const timeSlots = Array.from({ length: 22 }, (_, i) => {
        const hour = 8 + Math.floor(i / 2);
        const min = i % 2 === 0 ? 0 : 30;
        return { hour, min, label: `${hour.toString().padStart(2, "0")}:${min === 0 ? "00" : "30"}` };
    });

    const fields: Field[] = entrys
        .map(d => {
            const dayIdx = days.indexOf(d.day);
            if (dayIdx === -1) return null;
            const startSlotIdx = timeSlots.findIndex(slot => slot.hour + slot.min / 60 >= d.start);
            const endSlotIdx = timeSlots.findIndex(slot => slot.hour + slot.min / 60 >= d.end);
            if (startSlotIdx === -1 || endSlotIdx === -1) return null;
            return {
                key: d.id + '-' + d.text + '-' + d.day + '-' + d.start,
                content: d.text,
                gridRow: `${startSlotIdx + 2} / ${endSlotIdx + 2}`,
                gridColumn: (dayIdx + 2).toString(),
                position: "1/1",
                bgcolor: d.bgcolor,
                textcolor: d.textcolor,
                style: {}
            };
        }).filter(Boolean) as Field[]
            

    // Überlappungen und Subspalten dynamisch vergeben
    // Für jede Spalte (Tag)
    const columnMap: { [col: string]: Field[] } = {};
    for (const entry of fields) {
        if (!columnMap[entry.gridColumn]) columnMap[entry.gridColumn] = [];
        columnMap[entry.gridColumn].push(entry);
    }

    for (const col in columnMap) {
        const colEntries = columnMap[col];
        // Sortiere nach Start
        colEntries.sort((a, b) => {
            const [aStart] = a.gridRow.split("/").map(Number);
            const [bStart] = b.gridRow.split("/").map(Number);
            return aStart - bStart;
        });
        // Subspalten-Tracking
        const subColumns: Array<number[]> = [];
        // Für jedes Entry merken, in welcher Subspalte es ist
        const entrySubColIdx: Map<Field, number> = new Map();
        for (const entry of colEntries) {
            const [start, end] = entry.gridRow.split("/").map(Number);
            let assigned = false;
            for (let i = 0; i < subColumns.length; i++) {
                if (subColumns[i][1] <= start) {
                    subColumns[i] = [start, end];
                    entrySubColIdx.set(entry, i);
                    assigned = true;
                    break;
                }
            }
            if (!assigned) {
                subColumns.push([start, end]);
                entrySubColIdx.set(entry, subColumns.length - 1);
                // Jetzt: alle bisherigen Einträge müssen ihre position aktualisieren
                for (const e of colEntries) {
                    if (entrySubColIdx.has(e)) {
                        const idx = entrySubColIdx.get(e)!;
                        e.position = `${idx + 1}/${subColumns.length}`;
                    }
                }
            } else {
                // position für dieses Entry aktualisieren
                const idx = entrySubColIdx.get(entry)!;
                entry.position = `${idx + 1}/${subColumns.length}`;
            }
        }
    }


    return (
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
                {fields.map(entry => (
                    <div
                        key={entry.key}
                        className={`rounded px-1 flex items-center justify-center text-sm font-semibold`}
                        style={{
                            position: "relative",
                            gridRow: entry.gridRow,
                            gridColumn: entry.gridColumn,
                            zIndex: 2,
                            width: `${100 / parseInt(entry.position.split("/")[1])}%`,
                            left: `${(parseInt(entry.position.split("/")[0]) - 1) * (100 / parseInt(entry.position.split("/")[1]))}%`,
                            backgroundColor: entry.bgcolor,
                            color: entry.textcolor,
                        }}
                    >
                        {entry.content}
                    </div>
                ))}
            </div>
        </div>
    )
}
