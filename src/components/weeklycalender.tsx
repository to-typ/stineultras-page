"use client";

type Field = {
    key: string;
    content: string;
    gridColumn: string;
    start: string;
    end: string;
    position: string;
    bgcolor: string;
    textcolor: string;
    style: React.CSSProperties;
};

export type Entry = {
    id: number;
    text: string;
    day: string;
    start: string;
    end: string;
    bgcolor: string;
    textcolor: string;
};

export default function WeeklyCalender({days, entrys}: {days: string[], entrys: Entry[]}) {
    // Hilfsfunktion: Zeit-String (z.B. "18:10") in Minuten umwandeln
    function timeStringToMinutes(time: string): number {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
    }
 
    const timeSlots = Array.from({ length: 22 }, (_, i) => {
        const hour = 8 + Math.floor(i / 2);
        const min = i % 2 === 0 ? 0 : 30;
        return { hour, min, label: `${hour.toString().padStart(2, "0")}:${min === 0 ? "00" : "30"}` };
    });

    const fields: Field[] = entrys
        .map(d => {
            const dayIdx = days.indexOf(d.day);
            if (dayIdx === -1) return null;
            const startSlotIdx = timeSlots.findIndex(slot => slot.hour + slot.min / 60 >= timeStringToMinutes(d.start) / 60);
            const endSlotIdx = timeSlots.findIndex(slot => slot.hour + slot.min / 60 >= timeStringToMinutes(d.end) / 60);
            if (startSlotIdx === -1 || endSlotIdx === -1) return null;
            return {
                key: d.id + '-' + d.text + '-' + d.day + '-' + d.start,
                content: d.text,
                gridColumn: (dayIdx + 2).toString(),
                start: d.start,
                end: d.end,
                position: "1/1",
                bgcolor: d.bgcolor,
                textcolor: d.textcolor,
                style: {}
            };
        }).filter(Boolean) as Field[]
            
    const dayMap: { [col: string]: Field[] } = {};
    for (const entry of fields) {
        if (!dayMap[entry.gridColumn]) dayMap[entry.gridColumn] = [];
        dayMap[entry.gridColumn].push(entry);
    }

    for (const day in dayMap) {
        const dayEntries = dayMap[day];
        dayEntries.sort((a, b) => timeStringToMinutes(a.start) - timeStringToMinutes(b.start));
        const subDayColumns: Array<[number, number]> = [];
        const entrySubDayColIdx: Map<Field, number> = new Map();
        for (const entry of dayEntries) {
            const start = timeStringToMinutes(entry.start);
            const end = timeStringToMinutes(entry.end);
            let assigned = false;
            for (let i = 0; i < subDayColumns.length; i++) {
                if (subDayColumns[i][1] <= start) {
                    subDayColumns[i] = [start, end];
                    entrySubDayColIdx.set(entry, i);
                    assigned = true;
                    break;
                }
            }
            if (!assigned) {
                subDayColumns.push([start, end]);
                entrySubDayColIdx.set(entry, subDayColumns.length - 1);
                for (const e of dayEntries) {
                    if (entrySubDayColIdx.has(e)) {
                        const idx = entrySubDayColIdx.get(e)!;
                        e.position = `${idx + 1}/${subDayColumns.length}`;
                    }
                }
            } else {
                const idx = entrySubDayColIdx.get(entry)!;
                entry.position = `${idx + 1}/${subDayColumns.length}`;
            }
        }
    }
    console.log(fields);


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
                        className={`rounded px-1 flex items-center justify-center text-sm font-semibold border`}
                        style={{
                            position: "relative",
                            gridRow: `2/${timeSlots.length + 1}`,
                            gridColumn: entry.gridColumn,
                            zIndex: 2,
                            width: `${100 / parseInt(entry.position.split("/")[1])}%`,
                            left: `${(parseInt(entry.position.split("/")[0]) - 1) * (100 / parseInt(entry.position.split("/")[1]))}%`,
                            top: `${(timeStringToMinutes(entry.start) - timeStringToMinutes("8:00")) / 30 * 32}px`,
                            height: `${(timeStringToMinutes(entry.end) - timeStringToMinutes(entry.start)) / 30 * 32}px`,
                            backgroundColor: entry.bgcolor,
                            color: entry.textcolor,
                            borderColor: entry.textcolor,
                            borderWidth: "2px",
                        }}
                    >
                        {entry.content}
                    </div>
                ))}
            </div>
        </div>
    )
}
