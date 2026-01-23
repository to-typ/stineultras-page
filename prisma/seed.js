// prisma/seed.js
import pkg from '@prisma/client';
const { PrismaClient, VeranstaltungsTyp } = pkg;

const prisma = new PrismaClient();

async function main() {
  const v1 = await prisma.veranstaltung.create({
    data: {
        name: 'Stine Ultras 2024',
        typ: VeranstaltungsTyp.UEBUNG,
        lehrende: 'Max Mustermann',
    },
  });


  const u1 = await prisma.uebungsgruppe.create({
    data: {
        name: 'Läufergruppe A',
        veranstaltung: {connect: {  id: v1.id }},
    },
  });

  await prisma.termin.create({
    data: {
        tag: new Date('2024-09-14T10:00:00Z'),
        uebung: {connect: { id: u1.id }},
        nummer: 1,
        raum: 'Sporthalle 1',
        startZeit: new Date('2024-09-14T10:00:00Z'),
        endZeit: new Date('2024-09-14T12:00:00Z'),
    },
  });
  

}

main()
  .then(() => {
    console.log('Database seeded successfully');
  })
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
