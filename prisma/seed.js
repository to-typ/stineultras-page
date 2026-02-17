// prisma/seed.js
import pkg from "@prisma/client";
const { PrismaClient, VeranstaltungsTyp } = pkg;

const prisma = new PrismaClient();

// Hilfsfunktion für Wochentage
function getDateByWeekday(weekday, hour, minute) {
  const days = { Mo: 1, Di: 2, Mi: 3, Do: 4, Fr: 5 };
  // Startdatum: Montag, 20. Januar 2025
  const baseDate = new Date("2025-01-20");
  const targetDay = days[weekday];
  const diff = targetDay - 1;
  const date = new Date(baseDate);
  date.setDate(baseDate.getDate() + diff);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function main() {
  console.log("🌱 Seeding database...");

  // Lösche vorhandene Daten
  await prisma.termin.deleteMany({});
  await prisma.uebungsgruppe.deleteMany({});
  await prisma.veranstaltung.deleteMany({});
  await prisma.semester.deleteMany({});

  // Semester erstellen
  const wise2425 = await prisma.semester.create({
    data: { name: "WiSe 24/25" },
  });

  const sose25 = await prisma.semester.create({
    data: { name: "SoSe 25" },
  });

  console.log("✅ Semester erstellt");

  // ==========================================
  // 1. VORLESUNG mit mehreren Terminen (Mo & Mi)
  // ==========================================
  const algorithmen = await prisma.veranstaltung.create({
    data: {
      name: "Algorithmen und Datenstrukturen",
      stineId: "64-001",
      typ: VeranstaltungsTyp.VORLESUNG,
      stineName: "AD-V",
      lehrende: "Prof. Dr. Susanne Germer",
      semesterId: wise2425.id,
    },
  });

  await prisma.termin.createMany({
    data: [
      {
        veranstaltungsId: algorithmen.id,
        nummer: 1,
        raum: "HS A",
        tag: getDateByWeekday("Mo", 10, 0),
        startZeit: new Date("1970-01-01T10:00:00Z"),
        endZeit: new Date("1970-01-01T12:00:00Z"),
      },
      {
        veranstaltungsId: algorithmen.id,
        nummer: 2,
        raum: "HS A",
        tag: getDateByWeekday("Mi", 10, 0),
        startZeit: new Date("1970-01-01T10:00:00Z"),
        endZeit: new Date("1970-01-01T12:00:00Z"),
      },
    ],
  });

  console.log("✅ Algorithmen (Vorlesung) erstellt");

  // ==========================================
  // 2. UEBUNG mit mehreren Übungsgruppen
  // ==========================================
  const softwareentwicklung = await prisma.veranstaltung.create({
    data: {
      name: "Übung zu Softwareentwicklung I",
      stineId: "64-427",
      typ: VeranstaltungsTyp.UEBUNG,
      stineName: "SE1-Ü",
      lehrende: "Dr. Oliver Kopp; Christian Rahe",
      semesterId: wise2425.id,
    },
  });

  const uebungA = await prisma.uebungsgruppe.create({
    data: {
      name: "Übungsgruppe A",
      veranstaltungsId: softwareentwicklung.id,
    },
  });

  const uebungB = await prisma.uebungsgruppe.create({
    data: {
      name: "Übungsgruppe B",
      veranstaltungsId: softwareentwicklung.id,
    },
  });

  const uebungC = await prisma.uebungsgruppe.create({
    data: {
      name: "Übungsgruppe C",
      veranstaltungsId: softwareentwicklung.id,
    },
  });

  await prisma.termin.createMany({
    data: [
      {
        uebungsId: uebungA.id,
        nummer: 1,
        raum: "F-334",
        tag: getDateByWeekday("Di", 14, 0),
        startZeit: new Date("1970-01-01T14:00:00Z"),
        endZeit: new Date("1970-01-01T16:00:00Z"),
      },
      {
        uebungsId: uebungB.id,
        nummer: 1,
        raum: "F-335",
        tag: getDateByWeekday("Mi", 14, 0),
        startZeit: new Date("1970-01-01T14:00:00Z"),
        endZeit: new Date("1970-01-01T16:00:00Z"),
      },
      {
        uebungsId: uebungC.id,
        nummer: 1,
        raum: "F-336",
        tag: getDateByWeekday("Do", 14, 0),
        startZeit: new Date("1970-01-01T14:00:00Z"),
        endZeit: new Date("1970-01-01T16:00:00Z"),
      },
    ],
  });

  console.log("✅ Softwareentwicklung (Übung mit Gruppen) erstellt");

  // ==========================================
  // 3. SEMINAR mit langem Namen
  // ==========================================
  const architekturseminar = await prisma.veranstaltung.create({
    data: {
      name: "Seminar Architekturzentrierte Softwareentwicklung",
      stineId: "64-427",
      typ: VeranstaltungsTyp.SEMINAR,
      stineName: "AzSE-S",
      lehrende: "Marion Wiese; Dr. Jan Christian Dammann",
      semesterId: wise2425.id,
    },
  });

  await prisma.termin.create({
    data: {
      veranstaltungsId: architekturseminar.id,
      nummer: 1,
      raum: "Online",
      tag: getDateByWeekday("Fr", 10, 0),
      startZeit: new Date("1970-01-01T10:00:00Z"),
      endZeit: new Date("1970-01-01T12:00:00Z"),
    },
  });

  console.log("✅ Architekturseminar erstellt");

  // ==========================================
  // 4. PRAKTIKUM mit Blocktermin
  // ==========================================
  const datenbankpraktikum = await prisma.veranstaltung.create({
    data: {
      name: "Datenbank-Praktikum",
      stineId: "64-112",
      typ: VeranstaltungsTyp.PRAKTIKUM,
      stineName: "DB-P",
      lehrende: "Prof. Dr. Norbert Ritter",
      semesterId: wise2425.id,
    },
  });

  await prisma.termin.create({
    data: {
      veranstaltungsId: datenbankpraktikum.id,
      nummer: 1,
      raum: "CIP-Pool D",
      tag: getDateByWeekday("Mo", 16, 0),
      startZeit: new Date("1970-01-01T16:00:00Z"),
      endZeit: new Date("1970-01-01T18:00:00Z"),
    },
  });

  console.log("✅ Datenbank-Praktikum erstellt");

  // ==========================================
  // 5. VORLESUNG mit Sonderzeichen und Umlauten
  // ==========================================
  const lineareAlgebra = await prisma.veranstaltung.create({
    data: {
      name: "Lineare Algebra für Informatiker/innen",
      stineId: "63-351",
      typ: VeranstaltungsTyp.VORLESUNG,
      stineName: "LA-V",
      lehrende: "Prof. Dr. Müller-Schönefeld",
      semesterId: wise2425.id,
    },
  });

  await prisma.termin.createMany({
    data: [
      {
        veranstaltungsId: lineareAlgebra.id,
        nummer: 1,
        raum: "HS B",
        tag: getDateByWeekday("Di", 8, 0),
        startZeit: new Date("1970-01-01T08:00:00Z"),
        endZeit: new Date("1970-01-01T10:00:00Z"),
      },
      {
        veranstaltungsId: lineareAlgebra.id,
        nummer: 2,
        raum: "HS B",
        tag: getDateByWeekday("Do", 8, 0),
        startZeit: new Date("1970-01-01T08:00:00Z"),
        endZeit: new Date("1970-01-01T10:00:00Z"),
      },
    ],
  });

  console.log("✅ Lineare Algebra erstellt");

  // ==========================================
  // 6. Übungen Statistical Signal Processing
  // ==========================================
  const statisticalSignal = await prisma.veranstaltung.create({
    data: {
      name: "Übungen Statistical Signal Processing",
      stineId: "64-351",
      typ: VeranstaltungsTyp.UEBUNG,
      stineName: "SSP-Ü",
      lehrende: "N/A",
      semesterId: wise2425.id,
    },
  });

  const sspUebung = await prisma.uebungsgruppe.create({
    data: {
      name: "Übung",
      veranstaltungsId: statisticalSignal.id,
    },
  });

  await prisma.termin.create({
    data: {
      uebungsId: sspUebung.id,
      nummer: 1,
      raum: "F-128",
      tag: getDateByWeekday("Fr", 14, 0),
      startZeit: new Date("1970-01-01T14:00:00Z"),
      endZeit: new Date("1970-01-01T16:00:00Z"),
    },
  });

  console.log("✅ Statistical Signal Processing erstellt");

  // ==========================================
  // 7. TUTORIUM mit später Zeit
  // ==========================================
  const matheTutorium = await prisma.veranstaltung.create({
    data: {
      name: "Mathematik-Tutorium",
      stineId: "63-999",
      typ: VeranstaltungsTyp.TUTORIUM,
      stineName: "Mathe-T",
      lehrende: "Studierende",
      semesterId: wise2425.id,
    },
  });

  await prisma.termin.create({
    data: {
      veranstaltungsId: matheTutorium.id,
      nummer: 1,
      raum: "Gruppenraum 3",
      tag: getDateByWeekday("Mi", 18, 0),
      startZeit: new Date("1970-01-01T18:00:00Z"),
      endZeit: new Date("1970-01-01T20:00:00Z"),
    },
  });

  console.log("✅ Mathematik-Tutorium erstellt");

  // ==========================================
  // 8. KOLLOQUIUM mit kurzem Termin
  // ==========================================
  const kolloquium = await prisma.veranstaltung.create({
    data: {
      name: "Informatik-Kolloquium",
      stineId: "64-999",
      typ: VeranstaltungsTyp.KOLLOQUIUM,
      stineName: "Info-K",
      lehrende: "Verschiedene Dozierende",
      semesterId: wise2425.id,
    },
  });

  await prisma.termin.create({
    data: {
      veranstaltungsId: kolloquium.id,
      nummer: 1,
      raum: "HS C",
      tag: getDateByWeekday("Do", 16, 0),
      startZeit: new Date("1970-01-01T16:00:00Z"),
      endZeit: new Date("1970-01-01T17:00:00Z"),
    },
  });

  console.log("✅ Kolloquium erstellt");

  // ==========================================
  // 9. PROJEKT für SoSe 25 (anderes Semester)
  // ==========================================
  const softwareprojekt = await prisma.veranstaltung.create({
    data: {
      name: "Software-Projekt",
      stineId: "64-500",
      typ: VeranstaltungsTyp.PROJEKT,
      stineName: "SP",
      lehrende: "Prof. Dr. Walid Maalej",
      semesterId: sose25.id,
    },
  });

  await prisma.termin.create({
    data: {
      veranstaltungsId: softwareprojekt.id,
      nummer: 1,
      raum: "Projekt-Raum 1",
      tag: getDateByWeekday("Mi", 10, 0),
      startZeit: new Date("1970-01-01T10:00:00Z"),
      endZeit: new Date("1970-01-01T14:00:00Z"),
    },
  });

  console.log("✅ Software-Projekt (SoSe) erstellt");

  // ==========================================
  // 10. VORLESUNG mit Zeitüberschneidung (Mo 10-12 wie Algorithmen)
  // ==========================================
  const rechnernetze = await prisma.veranstaltung.create({
    data: {
      name: "Rechnernetze",
      stineId: "64-211",
      typ: VeranstaltungsTyp.VORLESUNG,
      stineName: "RN-V",
      lehrende: "Prof. Dr. Hannes Frey",
      semesterId: wise2425.id,
    },
  });

  await prisma.termin.create({
    data: {
      veranstaltungsId: rechnernetze.id,
      nummer: 1,
      raum: "HS D",
      tag: getDateByWeekday("Mo", 10, 0),
      startZeit: new Date("1970-01-01T10:00:00Z"),
      endZeit: new Date("1970-01-01T12:00:00Z"),
    },
  });

  console.log("✅ Rechnernetze (mit Überschneidung) erstellt");

  // ==========================================
  // 11. EDGE CASE: Veranstaltung OHNE Termine
  // ==========================================
  await prisma.veranstaltung.create({
    data: {
      name: "Selbststudium Programmierung",
      stineId: "64-000",
      typ: VeranstaltungsTyp.SELBSTSTUDIUM,
      stineName: "Selbst",
      lehrende: "-",
      semesterId: wise2425.id,
    },
  });

  console.log("✅ Selbststudium (ohne Termine) erstellt");

  // ==========================================
  // Statistik ausgeben
  // ==========================================
  const veranstaltungen = await prisma.veranstaltung.count();
  const termine = await prisma.termin.count();
  const uebungsgruppen = await prisma.uebungsgruppe.count();

  console.log("\n📊 Seed-Statistik:");
  console.log(`   • ${veranstaltungen} Veranstaltungen`);
  console.log(`   • ${uebungsgruppen} Übungsgruppen`);
  console.log(`   • ${termine} Termine`);
  console.log("\n🎉 Database seeded successfully!");
}

main()
  .then(() => {
    console.log("\n✨ Done!");
  })
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
