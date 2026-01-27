import { NextRequest, NextResponse } from "next/server";
import { VeranstaltungsTyp, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type JobStatus = 'pending' | 'running' | 'completed' | 'error';
type Job = {
    id: string;
    status: JobStatus;
    error?: string;
    createdAt: Date;
    completedAt?: Date;
};

const jobs = new Map<string, Job>();

//Test URLs ------------------------------------------------
// const urlEventMenu = 'https://www.stine.uni-hamburg.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=ACTION&ARGUMENTS=-AOIRQVyI3yOi8SRKgfbOi1I-EA5k6~IbrQQu3vIzBc29qLEaa7Ai6KxX0JJGoRM~8Bof92S3-heBl-4LDQW1AVVtQvhAh51sUMbIMvNOLYm-Jnoy9SsqOzPUvL6ZprWKCIey9Al2Yk6DmA3D5BjuiB22Yz1nzMGExUjKqia-Xh~TMgy4GK1XCpx3DdkaLNkI34a-rBDD3xn6R5Qc_';
// const urllowestMenu = 'https://www.stine.uni-hamburg.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=ACTION&ARGUMENTS=-AawyuPmiQ-H8NpWhPylm4aQB9T5E8Ee0J~eToCr2JzXaaD4MOI0U5fClAZoVrpERdaRnm~KMJsWUsKmlA~B4-mUVnlbo9ko726uaHtyEHiBs1HSVIHM8VvHfRlBa7FBlagPxPZ9zcuIrLu7iv1rRaIdOZrvGz7gyvJF7GAcMhw-gyDstFmALTcbNR3bOOj80qg0uVIWkhENcHYlw_';
// const urlEvent = 'https://www.stine.uni-hamburg.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=COURSEDETAILS&ARGUMENTS=-N000000000000001,-N000725,-N0,-N394345008561775,-N394345008583776,-N0,-N0,-N0';
// const urlSubgroup = 'https://www.stine.uni-hamburg.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=COURSEDETAILS&ARGUMENTS=-N000000000000001,-N000725,-N391396481147841,-N394345008718797,-N394345008852800,-N0,-N000000000000000,-N0';  
//----------------------------------------------------------

const stineBaseURL = 'https://www.stine.uni-hamburg.de';
const stineURL2526 = 'https://www.stine.uni-hamburg.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=ACTION&ARGUMENTS=-AyWhCKzswcs-c6Byp9xtolWBxvzFmFk0QpruFGBmRNFjlPz43J2ag0L5ha5-89vKhj2PvYDbIdNHfyXlIqS0Cb3gY7vrV-05CVsDJOmjltPkq6ijPzRVeUo9twJDU4IjTtgSJ0Afq0Cv4ClqOyuTKiMzzHYRORro8iznXvXszKJ~RxZSouhqsq~klyQ__';

//---------------------------------------------------
//    _____                    _           
//   / ____|                  | |          
//  | |     _ __ __ ___      _| | ___ _ __ 
//  | |    | '__/ _` \ \ /\ / / |/ _ \ '__|
//  | |____| | | (_| |\ V  V /| |  __/ |   
//   \_____|_|  \__,_| \_/\_/ |_|\___|_|                            
//---------------------------------------------------

async function crawlSemester(semester: string) {
    if (semester === null || semester === undefined || semester === '') {
        console.log(`Crawling menu: null semester`);
        return null;
    } else {
        let url = '';
        switch (semester) {
            case 'WiSe 25/26':
                url = stineURL2526;
        }
        if (url === '') {
            console.log(`Crawling menu: no url for semester ${semester}`);
            return;
        }

        const sem = await prisma.semester.create({
            data: {
                name: semester,
            },
        });
        return crawlMenu(url, sem.id);
    }
}

async function crawlMenu(url: string, semesterId: number): Promise<Object> {
    if (url === null || url === undefined || url === '') {
        console.log(`Crawling menu: null url`);
        return {};
    } else {
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000)); 
        console.log(`Crawling menu: ${url}`);

        const website = async () => {
            return await fetch(url, {
                method: 'GET',
            });
        }
        const response = await website();
        const html = await response.text();
        
        if (html.includes('auditRegistrationList')) {
            if (html.includes('Veranstaltungen / Module')) {
                const veranstaltungen = findVeranstaltungen(html);
                const results = [];
                for (const veranstaltung of veranstaltungen) {
                    results.push(await crawlVeranstaltung(stineBaseURL + veranstaltung.url, semesterId));
                }
            }
            const submenuLinks = findSubmenus(html);
            const results = [];
            for (const submenu of submenuLinks) {
                results.push(await crawlMenu(stineBaseURL + submenu.href, semesterId));
            }
            return { submenus: results };
        } else {
            const veranstaltungen = findVeranstaltungen(html);
            const results = [];
            for (const veranstaltung of veranstaltungen) {
                results.push(await crawlVeranstaltung(stineBaseURL + veranstaltung.url, semesterId));
            }
            return { events: results };
        }
    }
}

async function crawlVeranstaltung(url: string, semesterId: number) {
    if (url === null || url === undefined || url === '') {
        console.log(`Crawling event: null url`);
        return null;
    } else {
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000)); 
        console.log(`Crawling event: ${url}`);
        const website = async () => {
            return await fetch(url, {
                method: 'GET',
            });
        }
        const response = await website();
        const html = await response.text();
        const eventData = getVeranstaltungData(html);
        const result = await prisma.veranstaltung.create({
            data: {
                name: eventData.name,
                stineId: eventData.stineId,
                typ: eventData.type,
                stineName: eventData.stineName,
                lehrende: eventData.person,
                semester: { connect: { id: semesterId } },
            },
        });
        if (eventData.type === VeranstaltungsTyp.UEBUNG) {
            const subgroups = findUebungsgruppen(html);
            const results = [];
            for (const subgroup of subgroups) {
                results.push(await crawlUebungsgruppe(stineBaseURL + subgroup.href, result.id));
            }
            return { subgroups: results };
        } else {
            const dates = await crawlTermin(html, undefined, result.id);
            return { event: result, dates: dates };
        }
    }
}

async function crawlUebungsgruppe(url: string, eventId: number) {
    if (url === null || url === undefined || url === '') {
        return null;
    } else {
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000)); 
        const website = async () => {
            return await fetch(url, {
                method: 'GET',
            });
        }

        const response = await website();
        const html = await response.text();
        const uebungsgruppeData = getUebungsgruppeData(html);
        const subgroup = await prisma.uebungsgruppe.create({
            data: {
                name: uebungsgruppeData.name,
                veranstaltung: { connect: { id: eventId } },
            },
        });
        const dates = await crawlTermin(html, subgroup.id, undefined);
        return { subgroup: subgroup, dates: dates };
    }
}

async function crawlTermin(html: string, subgroupId?: number, eventId?: number) {
    const dates = findTermine(html);
    for (const date of dates) {
        if (subgroupId === undefined && eventId !== undefined) {
            await prisma.termin.create({
                data: {
                    tag: new Date(date.date + 'T' + date.starttime),
                    veranstaltung: { connect: { id: eventId } },
                    nummer: date.number,
                    raum: date.location,
                    startZeit: new Date(date.date + 'T' + date.starttime),
                    endZeit: new Date(date.date + 'T' + date.endtime),
                },
            });
        } else if (subgroupId !== undefined) {
            await prisma.termin.create({
                data: {
                    tag: new Date(date.date + 'T' + date.starttime),
                    uebung: { connect: { id: subgroupId } },
                    nummer: date.number,
                    raum: date.location,
                    startZeit: new Date(date.date + 'T' + date.starttime),
                    endZeit: new Date(date.date + 'T' + date.endtime),
                },
            });
        }
    }
    return { dates: dates };
}

//--------------------------------------------------
//   ______ _           _           
//  |  ____(_)         | |          
//  | |__   _ _ __   __| | ___ _ __ 
//  |  __| | | '_ \ / _` |/ _ \ '__|
//  | |    | | | | | (_| |  __/ |   
//  |_|    |_|_| |_|\__,_|\___|_|                      
//---------------------------------------------------

function findSubmenus(html: string): Array<{title: string, href: string}> {
    const links: Array<{title: string, href: string}> = [];
    const listMatch = html.match(/<ul class="auditRegistrationList"[^>]*>([\s\S]*?)<\/ul>/);
    
    if (!listMatch) {
        return links;
    }
    
    const listContent = listMatch[1];
    const linkRegex = /<a class="auditRegNodeLink" href="([^"]*)"[^>]*>\s*([^<]*)\s*<\/a>/g;

    let match;
    while ((match = linkRegex.exec(listContent)) !== null) {
        const href = match[1].replace(/&amp;/g, '&'); 
        const title = match[2].trim();
        links.push({
            title: title,
            href: href
        });
    }
    return links;
}

function findVeranstaltungen(html: string): Array<{name: string, url: string}> {
    const events: Array<{name: string, url: string}> = [];
    const eventRegex = /<a name="eventLink"\s+href="([^"]*)"[^>]*>\s*([^<]*)\s*<\/a>/g;

    let match;
    while ((match = eventRegex.exec(html)) !== null) {
        const url = match[1].replace(/&amp;/g, '&'); 
        const name = match[2].trim();
        
        events.push({
            name: name,
            url: url
        });
    }
    return events;
}

function findTermine(html: string): Array<{date: string, starttime: string, endtime: string, location: string, number: number}> {
    const dates: Array<{date: string, starttime: string, endtime: string, location: string, number: number}> = [];
    const dateRegex = /<div class="courseListCell[^"]*"[^>]*title="([^"]*)"[^>]*>\s*<span[^>]*>([^<]*)<span/g;

    let match;
    while ((match = dateRegex.exec(html)) !== null) {
        const titleContent = match[1];
        const number = parseInt(match[2].trim(), 10);

        const parts = titleContent.split(' / ');

        const monthMap: { [key: string]: string } = {
        'Jan': '01', 'Feb': '02', 'Mär': '03', 'Apr': '04',
        'Mai': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
        'Sep': '09', 'Okt': '10', 'Nov': '11', 'Dez': '12'
        };
        const datePart = parts[0].replace(/^[A-Za-z]+,\s*/, '').replaceAll('.', '').trim().split(' ');
        const day = datePart[0].padStart(2, '0');
        const month = monthMap[datePart[1]];
        const year = datePart[2];
        const dbDate = `${year}-${month}-${day}`;

        const time = parts[1].trim();
        const starttime = time.split('-')[0].trim();
        const endtime = time.split('-')[1].trim();
        
        if (parts.length >= 3) {
            dates.push({
                date: dbDate,        
                starttime: starttime,       
                endtime: endtime,
                location: parts[2].trim(),
                number: number
            });
        }
    }
    return dates;
}

function findUebungsgruppen(html: string): Array<{name: string, href: string}> {
    const subgroups: Array<{name: string, href: string}> = [];
    
    const kleingruppenRegex = /<ul class="dl-ul-listview[^"]*"[^>]*>([\s\S]*?)<\/ul>/g;
    const sectionMatch = kleingruppenRegex.exec(html);
    
    if (!sectionMatch) {
        return subgroups;
    }
    
    const listContent = sectionMatch[1];
    
    const groupRegex = /<p class="dl-ul-li-headline"><strong>(.*?)<\/strong><\/p>/g;
    let match;
    
    while ((match = groupRegex.exec(listContent)) !== null) {
        const name = match[1].trim();
        
        const afterGroupName = listContent.substring(match.index);
        const linkMatch = afterGroupName.match(/<a href="([^"]*)"[^>]*>\s*Kleingruppe anzeigen\s*<\/a>/);
        
        const href = linkMatch ? linkMatch[1].replace(/&amp;/g, '&') : '';
        
        subgroups.push({
            name: name,
            href: href
        });
    }
    
    return subgroups;
}

//--------------------------------------------------
//   _____        _        
//  |  __ \      | |       
//  | |  | | __ _| |_ __ _ 
//  | |  | |/ _` | __/ _` |
//  | |__| | (_| | || (_| |
//  |_____/ \__,_|\__\__,_|                   
//---------------------------------------------------

function getUebungsgruppeData(html: string): {name: string}  {
    const nameRegex = /<h1[^>]*>\s*([^<]+?)\s*<\/h1>/;
    const nameMatch = nameRegex.exec(html);
    if (nameMatch) {
        return {
            name: nameMatch[1].trim(),
        };
    }
    return { name: "" };
}

function getVeranstaltungData(html: string): {type: VeranstaltungsTyp, stineId: string, name: string, stineName: string, person: string}  {
    const typeRegex = /Veranstaltungsart:[\s\S]*?<div[^>]*>\s*([^\n<]+)/;
    const nameRegex = /<h1[^>]*>\s*([\d-\.\w]+)\s+(?:\(\d+\s+LP\)\s+)?(.*?)\s*<\/h1>/;
    const personRegex = /<span[^>]*id="dozenten"[^>]*>([^<]*)<\/span>/;
    const stineNameRegex = /Anzeige im Stundenplan: [\s\S]*?<div[^>]*>\s*([^\n<]+)/;
    const typeMatch = typeRegex.exec(html);
    let nameMatch = nameRegex.exec(html);
    let personMatch = personRegex.exec(html);
    let stineNameMatch = stineNameRegex.exec(html);

    const type = typeMatch ? mapVeranstaltungsTyp(typeMatch[1].trim()) : VeranstaltungsTyp.UNDEFINED;

    let stineId = '';
    let name = '';
    if (nameMatch) {
        stineId = nameMatch[1].trim();
        name = nameMatch[2].trim();
    }

    let person = '';
    if (personMatch) {
        person = personMatch[1].trim();
    }

    let stineName = '';
    if (stineNameMatch) {
        stineName = stineNameMatch[1].trim();
    }
    
    return {
        type: type,
        stineId: stineId,
        name: name,
        stineName: stineName,
        person: person
    };
}

function mapVeranstaltungsTyp(type: string): VeranstaltungsTyp {
  switch (type) {
    case "ABK-Kurse": return VeranstaltungsTyp.ABK_KURSE;
    case "Anleitung": return VeranstaltungsTyp.ANLEITUNG;
    case "Arbeitsgemeinschaften": return VeranstaltungsTyp.ARBEITSGEMEINSCHAFTEN;
    case "Begleitseminar": return VeranstaltungsTyp.BEGLEITSEMINAR;
    case "Berufspraktische Übung": return VeranstaltungsTyp.BERUFSPRAKTISCHE_UEBUNG;
    case "Blocklehrveranstaltung": return VeranstaltungsTyp.BLOCKLEHRVERANSTALTUNG;
    case "Blockpraktikum": return VeranstaltungsTyp.BLOCKPRAKTIKUM;
    case "EDV-Tutorien": return VeranstaltungsTyp.EDV_TUTORIEN;
    case "Einführungskurs": return VeranstaltungsTyp.EINFUEHRUNGSKURS;
    case "Einführungsvorlesung": return VeranstaltungsTyp.EINFUEHRUNGSVORLESUNG;
    case "Ergänzende Sprachlehrveranstaltung": return VeranstaltungsTyp.ERGAENZENDE_SPRACHLEHRVERANSTALTUNG;
    case "Examenskolloquium": return VeranstaltungsTyp.EXAMENSKOLLOQUIUM;
    case "Exkursion": return VeranstaltungsTyp.EXKURSION;
    case "Exkursion/Praktikum": return VeranstaltungsTyp.EXKURSION_PRAKTIKUM;
    case "Förderkurs": return VeranstaltungsTyp.FOERDERKURS;
    case "Forschungskolloquium": return VeranstaltungsTyp.FORSCHUNGSKOLLOQUIUM;
    case "Forschungsseminar": return VeranstaltungsTyp.FORSCHUNGSSEMINAR;
    case "Geländepraktikum": return VeranstaltungsTyp.GELAENDEPRAKTIKUM;
    case "Geländepraktikum und Seminar": return VeranstaltungsTyp.GELAENDEPRAKTIKUM_UND_SEMINAR;
    case "Geländeübung": return VeranstaltungsTyp.GELAENDEUEBUNG;
    case "Geländeübung und Seminar": return VeranstaltungsTyp.GELAENDEUEBUNG_UND_SEMINAR;
    case "Große Exkursion": return VeranstaltungsTyp.GROSSE_EXKURSION;
    case "Großvorlesung": return VeranstaltungsTyp.GROSSVORLESUNG;
    case "Grundkurs": return VeranstaltungsTyp.GRUNDKURS;
    case "Halbtags-/Ganztagspraktikum": return VeranstaltungsTyp.HALBTAGS_GANZTAGS_PRAKTIKUM;
    case "Hauptseminar": return VeranstaltungsTyp.HAUPTSEMINAR;
    case "Hauptseminar/Vorlesung + Übung": return VeranstaltungsTyp.HAUPTSEMINAR_VORLESUNG_UEBUNG;
    case "Infoveranstaltung": return VeranstaltungsTyp.INFOVERANSTALTUNG;
    case "Integrierte Veranstaltung": return VeranstaltungsTyp.INTEGRIERTE_VERANSTALTUNG;
    case "Intensivkurs": return VeranstaltungsTyp.INTENSIVKURS;
    case "Interaktive Lehrveranstaltung": return VeranstaltungsTyp.INTERAKTIVE_LEHRVERANSTALTUNG;
    case "Kleine Exkursion": return VeranstaltungsTyp.KLEINE_EXKURSION;
    case "Kolloquium": return VeranstaltungsTyp.KOLLOQUIUM;
    case "Kompaktkurs": return VeranstaltungsTyp.KOMPAKTKURS;
    case "Kurspraktikum": return VeranstaltungsTyp.KURSPRAKTIKUM;
    case "Laborpraktikum": return VeranstaltungsTyp.LABORPRAKTIKUM;
    case "Lehrgang": return VeranstaltungsTyp.LEHRGANG;
    case "Lektürekurs": return VeranstaltungsTyp.LEKTUEREKURS;
    case "Lektüreseminar": return VeranstaltungsTyp.LEKTUERESEMINAR;
    case "Lesung": return VeranstaltungsTyp.LESUNG;
    case "Mittelseminar": return VeranstaltungsTyp.MITTELSEMINAR;
    case "Mittelseminar/Übung": return VeranstaltungsTyp.MITTELSEMINAR_UEBUNG;
    case "Mittelseminar/Übung/Vorleseung": return VeranstaltungsTyp.MITTELSEMINAR_UEBUNG_VORLESUNG;
    case "Musikalische Praxis": return VeranstaltungsTyp.MUSIKALISCHE_PRAXIS;
    case "Oberseminar": return VeranstaltungsTyp.OBERSEMINAR;
    case "Orientierungseinheit": return VeranstaltungsTyp.ORIENTIERUNGSEINHEIT;
    case "Praktikum": return VeranstaltungsTyp.PRAKTIKUM;
    case "Praktikum mit integriertem Seminar": return VeranstaltungsTyp.PRAKTIKUM_MIT_SEMINAR;
    case "Praktikumsseminar": return VeranstaltungsTyp.PRAKTIKUMSSEMINAR;
    case "Praxisbegleitseminar": return VeranstaltungsTyp.PRAXISBEGLEITSEMINAR;
    case "Praxisbezogene Einführung": return VeranstaltungsTyp.PRAXISBEZOGENE_EINFUEHRUNG;
    case "Projekt": return VeranstaltungsTyp.PROJEKT;
    case "Projekt + Seminar": return VeranstaltungsTyp.PROJEKT_SEMINAR;
    case "Projekt I": return VeranstaltungsTyp.PROJEKT_I;
    case "Projekt I/II": return VeranstaltungsTyp.PROJEKT_I_II;
    case "Projekt II": return VeranstaltungsTyp.PROJEKT_II;
    case "Projektseminar": return VeranstaltungsTyp.PROJEKTSEMINAR;
    case "Propädeutikum": return VeranstaltungsTyp.PROPAEDEUTIKUM;
    case "Proseminar": return VeranstaltungsTyp.PROSEMINAR;
    case "Prüfung": return VeranstaltungsTyp.PRUEFUNG;
    case "Ringvorlesung": return VeranstaltungsTyp.RINGVORLESUNG;
    case "Selbststudium": return VeranstaltungsTyp.SELBSTSTUDIUM;
    case "Seminar": return VeranstaltungsTyp.SEMINAR;
    case "Seminar I": return VeranstaltungsTyp.SEMINAR_I;
    case "Seminar Ia": return VeranstaltungsTyp.SEMINAR_IA;
    case "Seminar Ib": return VeranstaltungsTyp.SEMINAR_IB;
    case "Seminar II": return VeranstaltungsTyp.SEMINAR_II;
    case "Seminar III": return VeranstaltungsTyp.SEMINAR_III;
    case "Seminar/Exkursion": return VeranstaltungsTyp.SEMINAR_EXKURSION;
    case "Seminar/Übung": return VeranstaltungsTyp.SEMINAR_UEBUNG;
    case "Seminar/Übung/Vorlesung": return VeranstaltungsTyp.SEMINAR_UEBUNG_VORLESUNG;
    case "Seminar/Vorlesung": return VeranstaltungsTyp.SEMINAR_VORLESUNG;
    case "Sicht-/Hörtermin": return VeranstaltungsTyp.SICHT_HOERTERMIN;
    case "Sportkurs": return VeranstaltungsTyp.SPORTKURS;
    case "Sprachkurs": return VeranstaltungsTyp.SPRACHKURS;
    case "Sprachlehrveranstaltung": return VeranstaltungsTyp.SPRACHLEHRVERANSTALTUNG;
    case "Sprachlehrveranstaltung I": return VeranstaltungsTyp.SPRACHLEHRVERANSTALTUNG_I;
    case "Sprachlehrveranstaltung II": return VeranstaltungsTyp.SPRACHLEHRVERANSTALTUNG_II;
    case "Stilübung": return VeranstaltungsTyp.STILUEBUNG;
    case "Studie": return VeranstaltungsTyp.STUDIE;
    case "Translatorische Lehrveranstaltung": return VeranstaltungsTyp.TRANSLATORISCHE_LEHRVERANSTALTUNG;
    case "Translatorische Übung I": return VeranstaltungsTyp.TRANSLATORISCHE_UEBUNG_I;
    case "Translatorische Übung II": return VeranstaltungsTyp.TRANSLATORISCHE_UEBUNG_II;
    case "Tutorium": return VeranstaltungsTyp.TUTORIUM;
    case "Übung": return VeranstaltungsTyp.UEBUNG;
    case "Übung/Praktikum": return VeranstaltungsTyp.UEBUNG_PRAKTIKUM;
    case "Vertiefungsseminar": return VeranstaltungsTyp.VERTIEFUNGSSEMINAR;
    case "Vorlesung": return VeranstaltungsTyp.VORLESUNG;
    case "Vorlesung + Seminar": return VeranstaltungsTyp.VORLESUNG_SEMINAR;
    case "Vorlesung + Tutorium": return VeranstaltungsTyp.VORLESUNG_TUTORIUM;
    case "Vorlesung + Übung": return VeranstaltungsTyp.VORLESUNG_UEBUNG;
    case "Vorlesung/Seminar/Hauptseminar": return VeranstaltungsTyp.VORLESUNG_SEMINAR_HAUPTSEMINAR;
    case "Wissenschaftlicher Grundlagenkurs": return VeranstaltungsTyp.WISSENSCHAFTLICHER_GRUNDLAGENKURS;
    case "Wissenschaftliches Praktikum": return VeranstaltungsTyp.WISSENSCHAFTLICHES_PRAKTIKUM;
    case "Workshop": return VeranstaltungsTyp.WORKSHOP;

    default: return VeranstaltungsTyp.UNDEFINED;
  }
}


//--------------------------------------------------
//   _____                            _       
//  |  __ \                          | |      
//  | |__) |___  __ _ _   _  ___  ___| |_ ___ 
//  |  _  // _ \/ _` | | | |/ _ \/ __| __/ __|
//  | | \ \  __/ (_| | |_| |  __/\__ \ |_\__ \
//  |_|  \_\___|\__, |\__,_|\___||___/\__|___/
//                 | |                        
//                 |_|                        
//---------------------------------------------------


//Start crawl job
export async function POST(req: NextRequest) {
    const body = await req.json();
    
    const jobId = `job_${Date.now()}_${Math.random().toString(36)}`;
    jobs.set(jobId, {
        id: jobId,
        status: 'pending',
        createdAt: new Date()
    });
    
    (async () => {
        try {
            const job = jobs.get(jobId);
            if (job) {
                job.status = 'running';
                jobs.set(jobId, job);
            }
            console.log(`Starting crawl job ${jobId} for semester ${body.semester}`);
            const tu = 'https://www.stine.uni-hamburg.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=COURSEDETAILS&ARGUMENTS=-N000000000000001,-N000605,-N0,-N393775100880865,-N393775100816866,-N0,-N0,-N3,-AWzn6VBNwRzZVQjVA7dZjWNLs4gVAeul9HoHXVULBeD7FRzW5O-UtWN7dmDWgOqNwfBmPYDn97UUdmSLgv-PlHdo8QSKs3zHw3vZQOu5feWpleNfdYqlFVBRH4BGbxjiNc-PleqaZrqP5WNZIWYK64zPeQMeN4BUsONZ9mqwAxfPaVUUBmfUDPUWJmQmaQzoYCfGeVWWlvuA6QDPMCYmlvIWqfdLCHBUCVWou7NR3cSpvfzL8mBKHVYWkVNc6fgHTCWLEHdcAOWHpmMoBWDWIvZPvCfZFWDPhPYW8OjPh4Dc9QDGJmNWKHdU3eMLIfZ5AfUHTVDKQvkZzxjH-fjmoVf6LHuaZrMUA4DAjHdo0ODGFcdAjVBHdWYZ73fZavq6YvkZ7mScwxBwh3BApedUzcqc-3uoVVUUHYfLFRWoKRqK6cBRCRB6UmUWMRuPMQZctcoH-RzwlmNAuYz96mBLeWBUjQIUAYUmwxNHoVdUMWBKAf-LErDG37YB-cdVwYUp5HfGIVSRvvSHePSa9xNoIvQBZWQWs3SPzcoLUxqUuedHK4YetOoHSQNm-4oPCxNPFmZWxcDKYYBooeQolegWWcWHmQ-7deWmerDGTxjejcdKamqwoWolAOjL6RYPTOYwg3QRfPWiAcMPMvuKEHgHovMpjfZHbVBHDmYZlfDHWYvZ8cSmofBWgrMKxvuPgmIporDyjRqUhVNLB3W5-PjHBPf6pfvZ7cDASeqRLPBUyOURaHfoemBmCeD6S7UUqxzo-';
            const crawled = await crawlVeranstaltung(tu, 6)
            //const crawled = await crawlSemester(body.semester);
            
            const completedJob = jobs.get(jobId);
            if (completedJob) {
                completedJob.status = 'completed';
                completedJob.completedAt = new Date();
                jobs.set(jobId, completedJob);
            }
        } catch (error) {
            const errorJob = jobs.get(jobId);
            if (errorJob) {
                errorJob.status = 'error';
                errorJob.error = error instanceof Error ? error.message : 'Unknown error';
                errorJob.completedAt = new Date();
                jobs.set(jobId, errorJob);
            }
        }
    })();
    
    return NextResponse.json(
        { 
            jobId,
            status: 'pending',
            message: 'Crawl job started',
            statusUrl: `/api/admin/crawl?jobId=${jobId}`
        },
        { status: 202 }
    );
}

//Status check
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
        return NextResponse.json(
            { error: 'jobId parameter is required' },
            { status: 400 }
        );
    }
    
    const job = jobs.get(jobId);
    
    if (!job) {
        return NextResponse.json(
            { error: 'Job not found' },
            { status: 404 }
        );
    }
    
    return NextResponse.json(job);
}