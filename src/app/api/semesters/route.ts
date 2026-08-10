import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sortSemestersDesc } from "@/lib/semester-sort";

export async function GET() {
  try {
    const semesters = await prisma.semester.findMany({
      where: {
        isSelectable: true,
      },
      // Nur was der Planer braucht — die Crawl-URLs bleiben im Admin-Endpunkt.
      select: {
        id: true,
        name: true,
        isSelectable: true,
        startDatum: true,
        endDatum: true,
      },
    });

    // Chronologisch statt nach ID: neuestes Semester zuerst.
    return NextResponse.json(sortSemestersDesc(semesters));
  } catch (error) {
    console.error("Fehler beim Laden der Semester:", error);
    return NextResponse.json({ error: "Semester konnten nicht geladen werden" }, { status: 500 });
  }
}
