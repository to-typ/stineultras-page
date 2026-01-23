import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, VeranstaltungsTyp  } from "@prisma/client";

const prisma = new PrismaClient();

async function seedDB(/*data: any*/) {
    //const input = data;
    const v1 = await prisma.veranstaltung.create({
        data: {
            name: 'Stine Ultras 2024',
            typ: VeranstaltungsTyp.UEBUNG,
            lehrende: 'Max Mustermann',
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

export async function POST(/*req: NextRequest*/) {
  //const body = await req.json();
  const seeded = await seedDB(/*body*/);
  return NextResponse.json(seeded);
}
