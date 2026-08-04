import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
