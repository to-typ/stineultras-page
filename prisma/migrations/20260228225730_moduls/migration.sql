-- AlterTable
ALTER TABLE "Veranstaltung" ADD COLUMN     "url" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "Modul" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Modul_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VeranstaltungInModul" (
    "id" SERIAL NOT NULL,
    "veranstaltungsId" INTEGER NOT NULL,
    "modulId" INTEGER NOT NULL,

    CONSTRAINT "VeranstaltungInModul_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VeranstaltungInModul" ADD CONSTRAINT "VeranstaltungInModul_veranstaltungsId_fkey" FOREIGN KEY ("veranstaltungsId") REFERENCES "Veranstaltung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VeranstaltungInModul" ADD CONSTRAINT "VeranstaltungInModul_modulId_fkey" FOREIGN KEY ("modulId") REFERENCES "Modul"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
