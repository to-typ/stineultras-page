import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function searchDB(search: string, semesterId?: number) {
  const whereClause: Prisma.ModulWhereInput = {
    name: {
      contains: search,
      mode: "insensitive",
    },
  };

  if (semesterId) {
    whereClause.semesterId = semesterId;
  }

  return await prisma.modul.findMany({
    where: whereClause,
    include: {
      veranstaltungen: {
        include: {
          veranstaltung: true,
        },
      },
    },
  });
}

async function searchID(id: number) {
  const results = await prisma.modul.findMany({
    where: {
      veranstaltungen: {
        some: {
          id,
        },
      },
    },
  });
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
    const result = await searchID(id);
    if (result) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: "Keine Module gefunden" }, { status: 404 });
    }
  } else if (search) {
    const result = await searchDB(search, semesterId);
    if (result) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: "Keine Module gefunden" }, { status: 404 });
    }
  } else {
    return NextResponse.json({ error: "id und search fehlt" }, { status: 404 });
  }
}
