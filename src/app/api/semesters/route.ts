import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const semesters = await prisma.semester.findMany({
      where: {
        isSelectable: true,
      },
      orderBy: {
        id: "asc", // Neueste Semester zuerst
      },
    });

    return NextResponse.json(semesters);
  } catch (error) {
    console.error("Fehler beim Laden der Semester:", error);
    return NextResponse.json({ error: "Semester konnten nicht geladen werden" }, { status: 500 });
  }
}
