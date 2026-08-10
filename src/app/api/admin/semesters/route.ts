import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseDatumInput, toDatumString, validateZeitraum } from "@/lib/semester-datum";
import { sortSemestersDesc } from "@/lib/semester-sort";
import type { SemesterDto } from "@/types/crawl";

export async function GET() {
  const semesters = await prisma.semester.findMany({
    include: { _count: { select: { veranstaltungen: true, module: true } } },
  });

  // Chronologisch statt nach ID: neuestes Semester zuerst.
  const dto: SemesterDto[] = sortSemestersDesc(semesters).map((s) => ({
    id: s.id,
    name: s.name,
    isSelectable: s.isSelectable,
    crawlUrl: s.crawlUrl,
    modulCrawlUrl: s.modulCrawlUrl,
    startDatum: toDatumString(s.startDatum),
    endDatum: toDatumString(s.endDatum),
    veranstaltungenCount: s._count.veranstaltungen,
    modulCount: s._count.module,
  }));

  return NextResponse.json(dto);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name ist erforderlich." }, { status: 400 });
  }

  const startDatum = parseDatumInput(body?.startDatum);
  const endDatum = parseDatumInput(body?.endDatum);
  const datumFehler = validateZeitraum(startDatum, endDatum);
  if (datumFehler) {
    return NextResponse.json({ error: datumFehler }, { status: 400 });
  }

  try {
    const created = await prisma.semester.create({
      data: {
        name,
        crawlUrl: emptyToNull(body?.crawlUrl),
        modulCrawlUrl: emptyToNull(body?.modulCrawlUrl),
        isSelectable: body?.isSelectable !== false,
        startDatum,
        endDatum,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Dieses Semester existiert bereits." }, { status: 409 });
    }
    throw error;
  }
}

function emptyToNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}
