import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function searchDB(search: string, semesterId?: number) {
  const results = [];
  const whereClause: Prisma.VeranstaltungWhereInput = {
    OR: [
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        stineName: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        stineId: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        lehrende: {
          contains: search,
          mode: "insensitive",
        },
      },
    ],
  };

  // Füge Semester-Filter hinzu, falls angegeben
  if (semesterId) {
    whereClause.semesterId = semesterId;
  }

  const vResults = await prisma.veranstaltung.findMany({
    where: whereClause,
  });
  for (const v of vResults) {
    // Prüfe zuerst, ob Übungsgruppen existieren
    const uebungsgruppen = await prisma.uebungsgruppe.findMany({
      where: {
        veranstaltungsId: v.id,
      },
    });

    if (uebungsgruppen.length > 0) {
      // Veranstaltung hat Übungsgruppen
      const uebungsgruppenWithTermine = [];
      for (const u of uebungsgruppen) {
        const termine = await prisma.termin.findMany({
          where: {
            uebungsId: u.id,
          },
        });
        uebungsgruppenWithTermine.push({
          uebungsgruppe: u,
          termine: termine,
        });
      }
      results.push({
        veranstaltung: v,
        termine: null,
        uebungsgruppen: uebungsgruppenWithTermine,
      });
    } else {
      // Keine Übungsgruppen, hole direkte Termine der Veranstaltung
      const termine = await prisma.termin.findMany({
        where: {
          veranstaltungsId: v.id,
        },
      });
      results.push({
        veranstaltung: v,
        termine: termine,
        uebungsgruppen: null,
      });
    }
  }
  return results;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const semesterIdParam = url.searchParams.get("semesterId");
  const semesterId = semesterIdParam
    ? parseInt(semesterIdParam, 10)
    : undefined;

  const searched = await searchDB(search, semesterId);
  return NextResponse.json(searched);
}
