import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const stineURL = 'https://www.stine.uni-hamburg.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=ACTION&ARGUMENTS=-AyWhCKzswcs-c6Byp9xtolWBxvzFmFk0QpruFGBmRNFjlPz43J2ag0L5ha5-89vKhj2PvYDbIdNHfyXlIqS0Cb3gY7vrV-05CVsDJOmjltPkq6ijPzRVeUo9twJDU4IjTtgSJ0Afq0Cv4ClqOyuTKiMzzHYRORro8iznXvXszKJ~RxZSouhqsq~klyQ__';
//const stineURL2 = 'https://www.stine.uni-hamburg.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=ACTION&ARGUMENTS=-AgU3X1UUAinOcL-DaZPn1ePv26foiY5unP9D1ZU~QNBdXg9xjH8OUX5UwazdRFi0gOauyJJxXioJn7iQY1xdhRGIUPa1HDXKnMPiDCfIpjtM6DIfBr7tp2hmtAkTKnViz5tTpahxjT7IzWQ~3-PS5AxlZR1hsr~Kl6frzH8bl0O5DNEd-T47e8MBRGPt40yY6-MPfEVzbyZ~zsqo_';
const stineURL3 = 'https://www.stine.uni-hamburg.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=COURSEDETAILS&ARGUMENTS=-N000000000000001,-N000725,-N0,-N394275065814747,-N394275065800748,-N0,-N0,-N0';
async function crawl(data: string) {
    if (data === null || data === undefined || data === '') {
        return;
    } else {
        const website = async () => {
            return await fetch(stineURL3, {
                method: 'GET',
            });
        }
        const response = await website();
        const html = await response.text();
        // if (html.includes('auditRegistrationList')) {
        //     return {sublinks: findSublinks(html)};
        // } else {
        //     return {events: findEvents(html)};
        // }
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

function findDates(html: string): Array<{date: string, time: string, location: string}> {
    const dates: Array<{date: string, time: string, location: string}> = [];
    const dateRegex = /<div class="courseListCell[^"]*"[^>]*title="([^"]*)"[^>]*>/g;

    let match;
    while ((match = dateRegex.exec(html)) !== null) {
        const titleContent = match[1];
        const parts = titleContent.split(' / ');
        
        if (parts.length >= 3) {
            dates.push({
                date: parts[0].trim(),        
                time: parts[1].trim(),       
                location: parts[2].trim()    
            });
        }
    }
    return dates;
}

function findSubgroups(html: string): Array<{name: string, href: string}> {
    const subgroups: Array<{name: string, href: string}> = [];
    
    // Find the Kleingruppen section
    const kleingruppenRegex = /<ul class="dl-ul-listview[^"]*"[^>]*>([\s\S]*?)<\/ul>/g;
    const sectionMatch = kleingruppenRegex.exec(html);
    
    if (!sectionMatch) {
        return subgroups;
    }
    
    const listContent = sectionMatch[1];
    
    // Extract group names from the strong tags within dl-ul-li-headline
    const groupRegex = /<p class="dl-ul-li-headline"><strong>(.*?)<\/strong><\/p>/g;
    let match;
    
    while ((match = groupRegex.exec(listContent)) !== null) {
        const name = match[1].trim();
        
        // Find the corresponding link for this group
        // Look for the next <a> tag with href after this match position
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
    const deleted = await crawl(body);
    return NextResponse.json(deleted);
}