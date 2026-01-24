import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

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

const stineURL = 'https://www.stine.uni-hamburg.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=ACTION&ARGUMENTS=-AyWhCKzswcs-c6Byp9xtolWBxvzFmFk0QpruFGBmRNFjlPz43J2ag0L5ha5-89vKhj2PvYDbIdNHfyXlIqS0Cb3gY7vrV-05CVsDJOmjltPkq6ijPzRVeUo9twJDU4IjTtgSJ0Afq0Cv4ClqOyuTKiMzzHYRORro8iznXvXszKJ~RxZSouhqsq~klyQ__';
const stineURL2 = 'https://www.stine.uni-hamburg.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=ACTION&ARGUMENTS=-AgU3X1UUAinOcL-DaZPn1ePv26foiY5unP9D1ZU~QNBdXg9xjH8OUX5UwazdRFi0gOauyJJxXioJn7iQY1xdhRGIUPa1HDXKnMPiDCfIpjtM6DIfBr7tp2hmtAkTKnViz5tTpahxjT7IzWQ~3-PS5AxlZR1hsr~Kl6frzH8bl0O5DNEd-T47e8MBRGPt40yY6-MPfEVzbyZ~zsqo_';
const stineURL3 = 'https://www.stine.uni-hamburg.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=COURSEDETAILS&ARGUMENTS=-N000000000000001,-N000725,-N0,-N394275065814747,-N394275065800748,-N0,-N0,-N0';
const stineURL4 = 'https://www.stine.uni-hamburg.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=COURSEDETAILS&ARGUMENTS=-N000000000000001,-N000725,-N0,-N394345008718797,-N394345008706798,-N0,-N0,-N0';
const stineBaseURL = 'https://www.stine.uni-hamburg.de';
const stineURLtest = 'https://www.stine.uni-hamburg.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=COURSEDETAILS&ARGUMENTS=-N000000000000001,-N000725,-N0,-N394345008718797,-N394345008706798,-N0,-N0,-N0';
async function crawl(data: string, url: string) {
    if (data === null || data === undefined || data === '') {
        return;
    } else {
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000)); 
        const website = async () => {
            return await fetch(url, {
                method: 'GET',
            });
        }
        const response = await website();
        const html = await response.text();
        if (html.includes('auditRegistrationList')) {
            return crawl("x", stineBaseURL + findSublinks(html)[0].href);
        } else {
            return crawlEvent("x", stineBaseURL + findEvents(html)[0].url);
        }
    }
}

async function crawlEvent(data: string, url: string) {
    if (data === null || data === undefined || data === '') {
        return;
    } else {
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000)); 
        const website = async () => {
            return await fetch(url, {
                method: 'GET',
            });
        }
        const response = await website();
        const html = await response.text();
        const getEventDataResult = getEventData(html);
        if (getEventDataResult?.type === "Übung") {
            return crawlSubEvent("x", stineBaseURL + findSublinks(html)[0].href);
        } else {
            return findDates(html);
        }
    }
}

async function crawlSubEvent(data: string, url: string) {
    if (data === null || data === undefined || data === '') {
        return;
    } else {
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000)); 
        const website = async () => {
            return await fetch(url, {
                method: 'GET',
            });
        }
        const response = await website();
        const html = await response.text();
        return findDates(html);
    }
}

function findSublinks(html: string): Array<{title: string, href: string}> {
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

function findEvents(html: string): Array<{name: string, url: string}> {
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

function getEventData(html: string): {type: string, stineId: string, name: string, stineName: string, person: string} | null {
    const typeRegex = /Veranstaltungsart:[\s\S]*?<div[^>]*>\s*([^\n<]+)/;
    const nameRegex = /<h1[^>]*>\s*([\d-]+)\s+([^<]+?)\s*<\/h1>/;
    const personRegex = /<span[^>]*id="dozenten"[^>]*>([^<]*)<\/span>/;
    const stineNameRegex = /Anzeige im Stundenplan: [\s\S]*?<div[^>]*>\s*([^\n<]+)/;
    const typeMatch = typeRegex.exec(html);
    const nameMatch = nameRegex.exec(html);
    const personMatch = personRegex.exec(html);
    const stineNameMatch = stineNameRegex.exec(html);
    if (typeMatch && nameMatch && personMatch && stineNameMatch) {
        return {
            type: typeMatch[1].trim(),
            stineId: nameMatch[1].trim(),
            name: nameMatch[2].trim(),
            stineName: stineNameMatch[1].trim(),
            person: personMatch[1].trim()
        };
    } 
    return null;
}

function findDates(html: string): Array<{date: string, starttime: string, endtime: string, location: string, number: string}> {
    const dates: Array<{date: string, starttime: string, endtime: string, location: string, number: string}> = [];
    const dateRegex = /<div class="courseListCell[^"]*"[^>]*title="([^"]*)"[^>]*>\s*<span[^>]*>([^<]*)<span/g;

    let match;
    while ((match = dateRegex.exec(html)) !== null) {
        const titleContent = match[1];
        const number = match[2].trim();

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

function findSubgroups(html: string): Array<{name: string, href: string}> {
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

export async function POST(req: NextRequest) {
    const body = await req.json();
    
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
            
            const crawled = await crawl(body, stineURLtest);
            
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
    
    // Job-Status zurückgeben
    const response: any = {
        jobId: job.id,
        status: job.status,
        createdAt: job.createdAt
    };
    
    if (job.status === 'completed' && job.result) {
        response.result = job.result;
        response.completedAt = job.completedAt;
    }
    
    if (job.status === 'error' && job.error) {
        response.error = job.error;
        response.completedAt = job.completedAt;
    }
    
    return NextResponse.json(response);
}