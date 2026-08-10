import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseDatumInput, validateZeitraum } from "@/lib/semester-datum";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const semesterId = Number(id);
  if (!Number.isInteger(semesterId)) {
    return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const data: Prisma.SemesterUpdateInput = {};

  if (typeof body?.name === "string" && body.name.trim() !== "") {
    data.name = body.name.trim();
  }
  if (body && "crawlUrl" in body) {
    data.crawlUrl = emptyToNull(body.crawlUrl);
  }
  if (body && "modulCrawlUrl" in body) {
    data.modulCrawlUrl = emptyToNull(body.modulCrawlUrl);
  }
  if (typeof body?.isSelectable === "boolean") {
    data.isSelectable = body.isSelectable;
  }

  const hasStart = Boolean(body) && "startDatum" in body;
  const hasEnd = Boolean(body) && "endDatum" in body;

  if (hasStart || hasEnd) {
    const startDatum = hasStart ? parseDatumInput(body.startDatum) : undefined;
    const endDatum = hasEnd ? parseDatumInput(body.endDatum) : undefined;

    // Bei Teil-Updates gegen den gespeicherten Zeitraum prüfen, damit
    // Start/Ende auch einzeln nicht in die falsche Reihenfolge geraten.
    const current = await prisma.semester.findUnique({
      where: { id: semesterId },
      select: { startDatum: true, endDatum: true },
    });
    if (!current) {
      return NextResponse.json({ error: "Semester nicht gefunden." }, { status: 404 });
    }

    const fehler = validateZeitraum(
      hasStart ? startDatum : current.startDatum,
      hasEnd ? endDatum : current.endDatum,
    );
    if (fehler) {
      return NextResponse.json({ error: fehler }, { status: 400 });
    }

    if (hasStart) data.startDatum = startDatum ?? null;
    if (hasEnd) data.endDatum = endDatum ?? null;
  }

  try {
    const updated = await prisma.semester.update({ where: { id: semesterId }, data });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "Dieses Semester existiert bereits." }, { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Semester nicht gefunden." }, { status: 404 });
      }
    }
    throw error;
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const semesterId = Number(id);
  if (!Number.isInteger(semesterId)) {
    return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
  }

  const counts = await prisma.semester.findUnique({
    where: { id: semesterId },
    include: { _count: { select: { veranstaltungen: true, module: true, crawlJobs: true } } },
  });

  if (!counts) {
    return NextResponse.json({ error: "Semester nicht gefunden." }, { status: 404 });
  }

  if (counts._count.veranstaltungen > 0 || counts._count.module > 0) {
    return NextResponse.json(
      { error: "Semester enthält noch Daten. Bitte zuerst die Daten löschen." },
      { status: 409 },
    );
  }

  await prisma.$transaction([
    prisma.crawlJob.deleteMany({ where: { semesterId } }),
    prisma.semester.delete({ where: { id: semesterId } }),
  ]);

  return NextResponse.json({ message: "Semester gelöscht." });
}

function emptyToNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}
