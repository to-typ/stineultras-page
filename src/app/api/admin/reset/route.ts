import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type DeleteDBData = {
    type: 'termin' | 'uebungsgruppe' | 'veranstaltung';
} | null;

async function deleteDB(data: DeleteDBData) {
    if (data == null ) {
        return await prisma.$transaction([
            prisma.termin.deleteMany({}),
            prisma.uebungsgruppe.deleteMany({}),
            prisma.veranstaltung.deleteMany({}),
        ]);
    } else {
        switch (data.type) {
            case 'termin':
                return await prisma.termin.deleteMany({});
            case 'uebungsgruppe':
                return await prisma.uebungsgruppe.deleteMany({});
            case 'veranstaltung':
                return await prisma.veranstaltung.deleteMany({});
            default:
                throw new Error('Unknown type');
        }
    }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const deleted = await deleteDB(body);
  return NextResponse.json(deleted);
}


