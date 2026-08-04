import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Löscht alle Kursdaten eines Semesters; das Semester samt URLs bleibt bestehen. */
async function deleteSemesterData(semesterId: number) {
  return prisma.$transaction([
    prisma.termin.deleteMany({
      where: {
        OR: [{ veranstaltung: { semesterId } }, { uebung: { veranstaltung: { semesterId } } }],
      },
    }),
    prisma.uebungsgruppe.deleteMany({ where: { veranstaltung: { semesterId } } }),
    prisma.veranstaltungInModul.deleteMany({
      where: {
        OR: [{ veranstaltung: { semesterId } }, { modul: { semesterId } }],
      },
    }),
    prisma.modul.deleteMany({ where: { semesterId } }),
    prisma.veranstaltung.deleteMany({ where: { semesterId } }),
  ]);
}

/** Nur außerhalb der Produktion: löscht sämtliche Kursdaten aller Semester. */
async function deleteEverything() {
  return prisma.$transaction([
    prisma.termin.deleteMany({}),
    prisma.uebungsgruppe.deleteMany({}),
    prisma.veranstaltungInModul.deleteMany({}),
    prisma.modul.deleteMany({}),
    prisma.veranstaltung.deleteMany({}),
  ]);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (body?.semesterId !== undefined) {
    const semesterId = Number(body.semesterId);
    if (!Number.isInteger(semesterId)) {
      return NextResponse.json({ error: "Ungültige semesterId." }, { status: 400 });
    }

    const semester = await prisma.semester.findUnique({ where: { id: semesterId } });
    if (!semester) {
      return NextResponse.json({ error: "Semester nicht gefunden." }, { status: 404 });
    }

    const deleted = await deleteSemesterData(semesterId);
    return NextResponse.json({
      message: `Daten von "${semester.name}" gelöscht.`,
      deleted: deleted.map((d) => d.count),
    });
  }

  // Der globale Rundumschlag wurde bisher nur im Frontend versteckt — die Route
  // selbst war offen. Jetzt serverseitig gesperrt.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Der vollständige Reset ist in der Produktion gesperrt." },
      { status: 403 },
    );
  }

  const deleted = await deleteEverything();
  return NextResponse.json({
    message: "Alle Kursdaten gelöscht.",
    deleted: deleted.map((d) => d.count),
  });
}
