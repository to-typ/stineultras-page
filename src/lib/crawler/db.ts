import { prisma } from "@/lib/prisma";

/**
 * Beim Ergänzen eines bereits gecrawlten Semesters darf kein zweiter Satz
 * Module entstehen — deshalb erst suchen, dann anlegen. Entspricht der
 * stineId-Prüfung bei Veranstaltungen.
 */
export async function findOrCreateModul(name: string, semesterId: number) {
  const existing = await prisma.modul.findFirst({ where: { name, semesterId } });
  if (existing) {
    return existing;
  }
  return prisma.modul.create({
    data: { name, semester: { connect: { id: semesterId } } },
  });
}

/** Verhindert doppelte Verknüpfungen beim erneuten Crawlen. */
export async function linkVeranstaltungToModul(
  veranstaltungsId: number,
  modulId: number,
): Promise<void> {
  const existing = await prisma.veranstaltungInModul.findFirst({
    where: { veranstaltungsId, modulId },
  });
  if (existing) {
    return;
  }
  await prisma.veranstaltungInModul.create({
    data: {
      modul: { connect: { id: modulId } },
      veranstaltung: { connect: { id: veranstaltungsId } },
    },
  });
}
