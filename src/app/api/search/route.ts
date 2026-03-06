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
    const details = await searchJoin(v.id);
    results.push({
      veranstaltung: v,
      termine: details.termine,
      uebungsgruppen: details.uebungsgruppen,
      module: details.module,
    });
  }
  return results;
}

async function searchJoin(eventId: number) {
  let termine = null;
  let uebungsgruppen = null;
  // Prüfe zuerst, ob Übungsgruppen existieren
  uebungsgruppen = await prisma.uebungsgruppe.findMany({
    where: {
      veranstaltungsId: eventId,
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
  } else {
    // Keine Übungsgruppen, hole direkte Termine der Veranstaltung
    termine = await prisma.termin.findMany({
      where: {
        veranstaltungsId: eventId,
      },
    });
  }

  const inModuls = await prisma.modul.findMany({
    where: {
      veranstaltungen: {
        some: {
          veranstaltungsId: eventId,
        },
      },
    },
  });
  return {
    termine: termine,
    uebungsgruppen: uebungsgruppen,
    module: inModuls,
  };
}

async function searchID(id: number) {
  const v = await prisma.veranstaltung.findUnique({
    where: {
      id: id,
    },
  });
  if (!v) {
    return null;
  }
  const details = await searchJoin(v.id);
  return {
    veranstaltung: v,
    termine: details.termine,
    uebungsgruppen: details.uebungsgruppen,
  };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const idParam = url.searchParams.get("id");
  if (idParam) {
    const id = parseInt(idParam);
    const result = await searchID(id);
    if (result) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: "Veranstaltung nicht gefunden" }, { status: 404 });
    }
  }
  const semesterIdParam = url.searchParams.get("semesterId");
  const semesterId = semesterIdParam ? parseInt(semesterIdParam, 10) : undefined;

  const searched = await searchDB(search, semesterId);
  return NextResponse.json(searched);
}
