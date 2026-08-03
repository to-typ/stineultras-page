import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function searchJoin(eventId: number) {
  let termine = null;
  let uebungsgruppen = null;
  // Prüfe zuerst, ob Übungsgruppen existieren
  uebungsgruppen = await prisma.uebungsgruppe.findMany({
    where: {
      veranstaltungsId: eventId,
    },
  });

  if (uebungsgruppen.length > 0) {
    // Veranstaltung hat Übungsgruppen
    const uebungsgruppenWithTermine = [];
    for (const u of uebungsgruppen) {
      const termine = await prisma.termin.findMany({
        where: {
          uebungsId: u.id,
        },
      });
      uebungsgruppenWithTermine.push({
        uebungsgruppe: u,
        termine: termine,
      });
      uebungsgruppen = uebungsgruppenWithTermine;
    }
  } else {
    // Keine Übungsgruppen, hole direkte Termine der Veranstaltung
    termine = await prisma.termin.findMany({
      where: {
        veranstaltungsId: eventId,
      },
    });
  }

  const inModuls = await prisma.modul.findMany({
    where: {
      veranstaltungen: {
        some: {
          veranstaltungsId: eventId,
        },
      },
    },
  });
  return {
    termine: termine,
    uebungsgruppen: uebungsgruppen,
    module: inModuls,
  };
}
