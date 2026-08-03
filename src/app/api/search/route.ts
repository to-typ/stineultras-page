import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { searchJoin } from "@/lib/search-utils";

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
