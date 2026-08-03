import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { searchJoin } from "@/lib/search-utils";

type ModulQuery = { search: string; semesterId?: number } | { id: number };

async function searchDB(query: ModulQuery) {
  const whereClause: Prisma.ModulWhereInput =
    "id" in query
      ? { id: query.id }
      : {
          name: { contains: query.search, mode: "insensitive" },
          ...(query.semesterId ? { semesterId: query.semesterId } : {}),
        };

  const moduls = await prisma.modul.findMany({
    where: whereClause,
    include: {
      veranstaltungen: {
        include: {
          veranstaltung: true,
        },
      },
    },
  });

  // Für jede Veranstaltung die Termine fetchen
  const results = [];
  for (const modul of moduls) {
    const veranstaltungen = [];
    for (const v of modul.veranstaltungen) {
      const details = await searchJoin(v.veranstaltung.id);
      veranstaltungen.push({
        veranstaltung: v.veranstaltung,
        termine: details.termine,
        uebungsgruppen: details.uebungsgruppen,
        module: details.module,
      });
    }
    results.push({
      id: modul.id,
      name: modul.name,
      veranstaltungen: veranstaltungen,
    });
  }
  return results;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const idParam = url.searchParams.get("id");
  const search = url.searchParams.get("search");
  const semesterIdParam = url.searchParams.get("semesterId");
  const semesterId = semesterIdParam ? parseInt(semesterIdParam, 10) : undefined;

  if (idParam) {
    const id = parseInt(idParam);
    const result = await searchDB({ id });
    if (result) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: "Keine Module gefunden" }, { status: 404 });
    }
  } else if (search) {
    const result = await searchDB({ search, semesterId });
    if (result) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: "Keine Module gefunden" }, { status: 404 });
    }
  } else {
    return NextResponse.json({ error: "id und search fehlt" }, { status: 404 });
  }
}
