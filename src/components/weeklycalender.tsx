"use client";

type Field = {
  key: string;
  content: string;
  room?: string;
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
  room?: string;
  bgcolor: string;
  textcolor: string;
};

export default function WeeklyCalender({
  days,
  entrys,
}: {
  days: string[];
  entrys: Entry[];
}) {
  // Hilfsfunktion: Zeit-String (z.B. "18:10") in Minuten umwandeln
  function timeStringToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }

  const timeSlots = Array.from({ length: 29 }, (_, i) => {
    const hour = 8 + Math.floor(i / 2);
    const min = i % 2 === 0 ? 0 : 30;
    return {
      hour,
      min,
      label: `${hour.toString().padStart(2, "0")}:${min === 0 ? "00" : "30"}`,
    };
  });

  const fields: Field[] = entrys
    .map((d) => {
      const dayIdx = days.indexOf(d.day);
      if (dayIdx === -1) return null;
      const startSlotIdx = timeSlots.findIndex(
        (slot) =>
          slot.hour + slot.min / 60 >= timeStringToMinutes(d.start) / 60,
      );
      const endSlotIdx = timeSlots.findIndex(
        (slot) => slot.hour + slot.min / 60 >= timeStringToMinutes(d.end) / 60,
      );
      if (startSlotIdx === -1 || endSlotIdx === -1) return null;
      return {
        key: d.id + "-" + d.text + "-" + d.day + "-" + d.start,
        content: d.text,
        room: d.room,
        gridColumn: (dayIdx + 2).toString(),
        start: d.start,
        end: d.end,
        position: "1/1",
        bgcolor: d.bgcolor,
        textcolor: d.textcolor,
        style: {},
      };
    })
    .filter(Boolean) as Field[];

  const dayMap: { [col: string]: Field[] } = {};
  for (const entry of fields) {
    if (!dayMap[entry.gridColumn]) dayMap[entry.gridColumn] = [];
    dayMap[entry.gridColumn].push(entry);
  }

  for (const day in dayMap) {
    const dayEntries = dayMap[day];
    dayEntries.sort(
      (a, b) => timeStringToMinutes(a.start) - timeStringToMinutes(b.start),
    );

    // Berechne für jedes Event die maximale Anzahl gleichzeitiger Events
    for (let i = 0; i < dayEntries.length; i++) {
      const entry = dayEntries[i];
      const entryStart = timeStringToMinutes(entry.start);
      const entryEnd = timeStringToMinutes(entry.end);

      // Finde maximale Anzahl gleichzeitiger Events während der Laufzeit dieses Events
      let maxConcurrent = 1;

      // Prüfe jeden Zeitpunkt während der Laufzeit dieses Events
      for (let time = entryStart; time < entryEnd; time += 30) {
        let concurrent = 0;
        for (const other of dayEntries) {
          const otherStart = timeStringToMinutes(other.start);
          const otherEnd = timeStringToMinutes(other.end);
          if (time >= otherStart && time < otherEnd) {
            concurrent++;
          }
        }
        maxConcurrent = Math.max(maxConcurrent, concurrent);
      }

      // Finde alle Events die mit diesem Event überlappen
      const overlapping: Field[] = [];
      for (const other of dayEntries) {
        if (other === entry) continue;
        const otherStart = timeStringToMinutes(other.start);
        const otherEnd = timeStringToMinutes(other.end);
        if (entryStart < otherEnd && entryEnd > otherStart) {
          overlapping.push(other);
        }
      }

      // Finde die Position: welche Spalten sind bereits belegt?
      const usedColumns = new Set<number>();
      for (const other of overlapping) {
        if (other.position && timeStringToMinutes(other.start) <= entryStart) {
          const [pos] = other.position.split("/").map(Number);
          usedColumns.add(pos - 1);
        }
      }

      // Finde die erste freie Position
      let position = 0;
      while (usedColumns.has(position)) {
        position++;
      }

      entry.position = `${position + 1}/${maxConcurrent}`;
    }
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <div
        className="grid relative"
        style={{
          gridTemplateColumns: `90px repeat(${days.length}, minmax(120px, 1fr))`,
          gridTemplateRows: `50px repeat(${timeSlots.length}, 40px)`,
          minWidth: "800px",
        }}>
        {/* Header - Zeit */}
        <div
          className="bg-gradient-to-br from-slate-100 to-slate-50 border-r border-b border-slate-200 flex items-center justify-center font-semibold text-slate-700"
          style={{ gridRow: 1, gridColumn: 1 }}>
          Zeit
        </div>

        {/* Header - Tage */}
        {days.map((day, i) => (
          <div
            key={day}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 border-r border-b border-slate-200 flex items-center justify-center font-semibold text-slate-700"
            style={{ gridRow: 1, gridColumn: i + 2 }}>
            {day}
          </div>
        ))}

        {/* Zeitspalten */}
        {timeSlots.map((slot, rowIdx) => (
          <div
            key={slot.label}
            className="bg-slate-50 border-r border-b border-slate-200 flex items-center justify-center text-xs text-slate-600 font-medium"
            style={{ gridRow: rowIdx + 2, gridColumn: 1 }}>
            {slot.label}
          </div>
        ))}

        {/* Grid-Zellen */}
        {days.map((day, i) =>
          timeSlots.map((slot, rowIdx) => (
            <div
              key={`${day}-${slot.label}`}
              className="border-r border-b border-slate-100 bg-white hover:bg-slate-50 transition-colors"
              style={{ gridRow: rowIdx + 2, gridColumn: i + 2 }}
            />
          )),
        )}

        {/* Eventfelder */}
        {fields.map((entry) => (
          <div
            key={entry.key}
            className="rounded-md px-2 py-1 flex flex-col items-center justify-center text-xs font-semibold border-2 shadow-sm hover:shadow-md transition-all cursor-default overflow-hidden"
            style={{
              position: "relative",
              gridRow: `2/${timeSlots.length + 1}`,
              gridColumn: entry.gridColumn,
              zIndex: 3,
              width: `calc(${100 / parseInt(entry.position.split("/")[1])}% - 8px)`,
              left: `calc(${(parseInt(entry.position.split("/")[0]) - 1) * (100 / parseInt(entry.position.split("/")[1]))}% + 4px)`,
              top: `${((timeStringToMinutes(entry.start) - timeStringToMinutes("8:00")) / 30) * 40 + 4}px`,
              height: `${((timeStringToMinutes(entry.end) - timeStringToMinutes(entry.start)) / 30) * 40 - 8}px`,
              backgroundColor: entry.bgcolor,
              color: ((parseInt(entry.bgcolor.slice(1, 3), 16) * 299 + parseInt(entry.bgcolor.slice(3, 5), 16) * 587 + parseInt(entry.bgcolor.slice(5, 7), 16) * 114) / 1000 > 128 ? "#242424" : "#ffffff"),
              borderColor: entry.textcolor + "40",
            }}>
            <div className="w-full text-center leading-tight break-words">
              {entry.content}
            </div>
            {entry.room && (
              <div className="w-full text-center text-[10px] opacity-80 mt-1 break-words">
                {entry.room}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
