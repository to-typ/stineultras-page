import { Stundenplan } from "@/hooks/use-stundenplan";
import { Event, SearchResult, Visibility } from "../types/planner";
import { DAYS } from "./planner-utils";
import { NewEventData } from "@/components/add-event-modal";

const semesterZeit = new Map([
    ["SoSe 26", [new Date(2026, 4, 6), new Date(2026, 7, 18)]], 
]);

export function importStundeplan(
    createStundenplan: (name: string, semesterId: number) => void,
    addEvent: (eventData: NewEventData) => number | undefined,
    addSearchResult: (result: SearchResult) => number | null,
    toggleSubEvent: (eventId: number, subEventName: string) => void,
    changeEventColor: (eventId: number, color: string) => void,
    params: URLSearchParams 
) {
    // Stundenplan Erstellen
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
}

export function createShareLink(stundenplan: Stundenplan) {
    const url = `www.stineultras.de?`;
    const name = stundenplan?.name;
    const sem = stundenplan?.semesterId;
    const eventdata = stundenplan?.events
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

const toICSDate = (date: Date, time: Date) => {
    date = new Date(date);
    time = new Date(time);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}00`;
};

export function exportICS (events : Event[], semester: string) {
    const icsEvents = events
    .flatMap((e) => {
        if (e.info) {
        // Normale Events
        const allTermine = [
            ...(e.info.termine || []),
            ...(e.info.uebungsgruppen?.flatMap((ug) => ug.termine || []) || []),
        ];

        return allTermine.map((termin, index) => {
            const uid = `${Date.now()}-${Math.random()}-${index}@stine-ultras`;

            return [
            "BEGIN:VEVENT",
            `UID:${uid}`,
            `SUMMARY:${e.name}`,
            `DTSTART;TZID=Europe/Berlin:${toICSDate(termin.tag, termin.startZeit)}`,
            `DTEND;TZID=Europe/Berlin:${toICSDate(termin.tag, termin.endZeit)}`,
            `DTSTAMP:${toICSDate(new Date(), new Date())}`,
            `${termin.raum ? `LOCATION:${termin.raum}` : ""}`,
            "END:VEVENT",
            ].join("\r\n");
        });
        } else {
        // Eigene Events
        const semesterStart = semesterZeit.get(semester)?.[0] || new Date();
        const semesterEnd = semesterZeit.get(semester)?.[1] || new Date(semesterStart.getTime() + 1000 * 60 * 60 * 24 * 7 * 16); 
        return e.events.flatMap((sub) =>
            sub.dates.map((d, index) => {
            const uid = `${Date.now()}-${Math.random()}-${index}@stine-ultras`;
            const [startHour, startMinute] = d.start.split(":").map(Number);
            const [endHour, endMinute] = d.end.split(":").map(Number);
            const dayOffset = DAYS.indexOf(d.day);

            const result = [];
            for(let date = semesterStart; date <= semesterEnd; date.setDate(date.getDate() + 7)) {
                const startTime = new Date(date);
                startTime.setDate(startTime.getDate() + dayOffset);
                const endTime = new Date(date);
                endTime.setDate(endTime.getDate() + dayOffset);

                startTime.setHours(startHour, startMinute);
                endTime.setHours(endHour, endMinute);

                result.push([
                "BEGIN:VEVENT",
                `UID:${uid}`,
                `SUMMARY:${e.name} - ${sub.name}`,
                `DTSTART;TZID=Europe/Berlin:${toICSDate(startTime, startTime)}`,
                `DTEND;TZID=Europe/Berlin:${toICSDate(endTime, endTime)}`,
                `DTSTAMP:${toICSDate(new Date(), new Date())}`,
                `${d.room ? `LOCATION:${d.room}` : ""}`,
                "END:VEVENT",
                ].join("\r\n"));
            }

            return result.join("");
            }
        ));
        }
    })
    .join("");

    return ([
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//STiNE Ultras//Stundenplan Export//DE",
        "CALSCALE:GREGORIAN",
        icsEvents,
        "END:VCALENDAR",
    ].join("\r\n"));
};