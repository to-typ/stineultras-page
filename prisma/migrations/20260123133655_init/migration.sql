-- CreateEnum
CREATE TYPE "VeranstaltungsTyp" AS ENUM ('VORLESUNG', 'TUTORIUM', 'UEBUNG', 'ARBEITSGRUPPE');

-- CreateTable
CREATE TABLE "Veranstaltung" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "typ" "VeranstaltungsTyp" NOT NULL,
    "lehrende" TEXT NOT NULL,

    CONSTRAINT "Veranstaltung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Termin" (
    "id" SERIAL NOT NULL,
    "nummer" INTEGER NOT NULL,
    "raum" TEXT NOT NULL,
    "tag" TIMESTAMP(3) NOT NULL,
    "startZeit" TIME NOT NULL,
    "endZeit" TIME NOT NULL,
    "veranstaltungsId" INTEGER,
    "uebungsId" INTEGER,

    CONSTRAINT "Termin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Uebungsgruppe" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "veranstaltungsId" INTEGER NOT NULL,

    CONSTRAINT "Uebungsgruppe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Uebungsgruppe_veranstaltungsId_key" ON "Uebungsgruppe"("veranstaltungsId");

-- AddForeignKey
ALTER TABLE "Termin" ADD CONSTRAINT "Termin_veranstaltungsId_fkey" FOREIGN KEY ("veranstaltungsId") REFERENCES "Veranstaltung"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Termin" ADD CONSTRAINT "Termin_uebungsId_fkey" FOREIGN KEY ("uebungsId") REFERENCES "Uebungsgruppe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Uebungsgruppe" ADD CONSTRAINT "Uebungsgruppe_veranstaltungsId_fkey" FOREIGN KEY ("veranstaltungsId") REFERENCES "Veranstaltung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
