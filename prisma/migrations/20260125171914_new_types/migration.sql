/*
  Warnings:

  - The values [SPRACHLEHRVERNANSTALTUNG] on the enum `VeranstaltungsTyp` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VeranstaltungsTyp_new" AS ENUM ('VORLESUNG', 'TUTORIUM', 'UEBUNG', 'ARBEITSGRUPPE', 'UNDEFINED', 'RINGVORLESUNG', 'SEMINAR', 'PROJEKT', 'ABK_KURSE', 'VORLESUNG_UEBUNG', 'WISSENSCHAFTLICHER_GRUNDLAGENKURS', 'GRUNDKURS', 'SPRACHLEHRVERANSTALTUNG', 'KOLLOQUIUM', 'FORSCHUNGSKOLLOQUIUM', 'OBERSEMINAR', 'PROSEMINAR', 'INFOVERANSTALTUNG', 'ANLEITUNG', 'ORIENTIERUNGSEINHEIT', 'PRAKTIKUM_MIT_IINTEGRIERTEM_SEMINAR', 'PRAKTIKUM', 'SEMINAR_UEBUNG_VORLESUNG', 'SEMINAR_UEBUNG', 'INTEGRIERTE_VERANSTALTUNG');
ALTER TABLE "Veranstaltung" ALTER COLUMN "typ" TYPE "VeranstaltungsTyp_new" USING ("typ"::text::"VeranstaltungsTyp_new");
ALTER TYPE "VeranstaltungsTyp" RENAME TO "VeranstaltungsTyp_old";
ALTER TYPE "VeranstaltungsTyp_new" RENAME TO "VeranstaltungsTyp";
DROP TYPE "public"."VeranstaltungsTyp_old";
COMMIT;
