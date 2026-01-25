import { NextRequest, NextResponse } from "next/server";
import { VeranstaltungsTyp, PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type JobStatus = 'pending' | 'running' | 'completed' | 'error';
type Job = {
    id: string;
    status: JobStatus;
    result?: any;
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
        return null;
    } else {
        let url = '';
        switch (semester) {
            case 'WiSe 25/26':
                url = stineURL2526;
        }
        if (url === '') {
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

async function crawlMenu(url: string, semesterId: number): Promise<any> {
    if (url === null || url === undefined || url === '') {
        return null;
    } else {
        await new Promise(r => setTimeout(r, 3000 + Math.random() * 4000)); 

        const website = async () => {
            return await fetch(url, {
                method: 'GET',
            });
        }
        const response = await website();
        const html = await response.text();
        
        if (html.includes('auditRegistrationList')) {
            const submenuLinks = findSubmenus(html);
            let results = [];
            for (const submenu of submenuLinks) {
                results.push(await crawlMenu(stineBaseURL + submenu.href, semesterId));
            }
            return { submenus: results };
        } else {
            const veranstaltungen = findVeranstaltungen(html);
            let results = [];
            for (const veranstaltung of veranstaltungen) {
                results.push(await crawlVeranstaltung(stineBaseURL + veranstaltung.url, semesterId));
            }
            return { events: results };
        }
    }
}

async function crawlVeranstaltung(url: string, semesterId: number) {
    if (url === null || url === undefined || url === '') {
        return null;
    } else {
        await new Promise(r => setTimeout(r, 3000 + Math.random() * 4000)); 
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
            let results = [];
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
        await new Promise(r => setTimeout(r, 3000 + Math.random() * 4000)); 
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
    const nameRegex = /<h1[^>]*>\s*([\d-]+)\s+([^<]+?)\s*<\/h1>/;
    const personRegex = /<span[^>]*id="dozenten"[^>]*>([^<]*)<\/span>/;
    const stineNameRegex = /Anzeige im Stundenplan: [\s\S]*?<div[^>]*>\s*([^\n<]+)/;
    const typeMatch = typeRegex.exec(html);
    const nameMatch = nameRegex.exec(html);
    const personMatch = personRegex.exec(html);
    const stineNameMatch = stineNameRegex.exec(html);

    let type;
    switch (typeMatch ? typeMatch[1].trim() : '') {
        case 'Vorlesung':
            type = VeranstaltungsTyp.VORLESUNG;
            break;
        case 'Übung':
            type = VeranstaltungsTyp.UEBUNG;
            break;
        default:
            type = VeranstaltungsTyp.UNDEFINED;
            break;
    }

    if (typeMatch && nameMatch && personMatch && stineNameMatch) {
        return {
            type: type,
            stineId: nameMatch[1].trim(),
            name: nameMatch[2].trim(),
            stineName: stineNameMatch[1].trim(),
            person: personMatch[1].trim()
        };
    } 
    return {
        type: VeranstaltungsTyp.UNDEFINED,
        stineId: "",
        name: "",
        stineName: "",
        person: ""
    };
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
            const crawled = await crawlSemester(body);
            
            const completedJob = jobs.get(jobId);
            if (completedJob) {
                completedJob.status = 'completed';
                completedJob.result = crawled;
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