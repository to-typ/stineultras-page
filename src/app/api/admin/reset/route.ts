import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

function verifyToken(token: string): boolean {
  const adminToken = process.env.ADMIN_TOKEN || "admin-secret-token";
  return token === adminToken;
}

const prisma = new PrismaClient();

async function deleteDB(data: string) {
  if (data === null || data === undefined || data === "") {
    return await prisma.$transaction([
      prisma.termin.deleteMany({}),
      prisma.uebungsgruppe.deleteMany({}),
      prisma.veranstaltung.deleteMany({}),
    ]);
  } else {
    switch (data) {
      case "termin":
        return await prisma.termin.deleteMany({});
      case "uebungsgruppe":
        return await prisma.uebungsgruppe.deleteMany({});
      case "veranstaltung":
        return await prisma.veranstaltung.deleteMany({});
      default:
        throw new Error("Unknown type");
    }
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!verifyToken(body.token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const deleted = await deleteDB(body.data);
  return NextResponse.json(deleted);
}
