import { NextResponse } from "next/server";
import { PrismaClient, VeranstaltungsTyp  } from "@prisma/client";

const prisma = new PrismaClient();

async function seedDB() {
    const s1 = await prisma.semester.create({
        data: {
            name: 'WiSe 24/25', 
        },
    });
    
    const v1 = await prisma.veranstaltung.create({
        data: {
            name: 'Stine Ultras 2024',
            stineId: '64.128',
            typ: VeranstaltungsTyp.UEBUNG,
            stineName: 'SU-Üb',
            lehrende: 'Max Mustermann',
            semester: {connect: { id: s1.id }},
        },
    });

    const u1 = await prisma.uebungsgruppe.create({
        data: {
            name: 'Läufergruppe A',
            veranstaltung: {connect: {  id: v1.id }},
        },
    });

    const t1 = await prisma.termin.create({
        data: {
            tag: new Date('2024-09-14T10:00:00Z'),
            uebung: {connect: { id: u1.id }},
            nummer: 1,
            raum: 'Sporthalle 1',
            startZeit: new Date('2024-09-14T10:00:00Z'),
            endZeit: new Date('2024-09-14T12:00:00Z'),
        },
    });

    return { veranstaltung: v1, uebungsgruppe: u1, termin: t1 };
}

export async function POST() {
  const seeded = await seedDB();
  return NextResponse.json(seeded);
}
