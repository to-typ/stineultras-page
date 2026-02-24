import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const semesters = await prisma.semester.findMany({
      where: {
        isSelectable: true,
      },
      orderBy: {
        id: "desc", // Neueste Semester zuerst
      },
    });

    return NextResponse.json(semesters);
  } catch (error) {
    console.error("Fehler beim Laden der Semester:", error);
    return NextResponse.json(
      { error: "Semester konnten nicht geladen werden" },
      { status: 500 },
    );
  }
}
