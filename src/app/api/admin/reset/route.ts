import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteDB(/*data: any*/) {
    //const input = data;
    return await prisma.$transaction([
        prisma.termin.deleteMany({}),
        prisma.uebungsgruppe.deleteMany({}),
        prisma.veranstaltung.deleteMany({}),
    ]);
}

export async function POST(req: NextRequest) {
  //const body = await req.json();
  const deleted = await deleteDB(/*body*/);
  return NextResponse.json(deleted);
}


