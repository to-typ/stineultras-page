-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "VeranstaltungsTyp" ADD VALUE 'RINGVORLESUNG';
ALTER TYPE "VeranstaltungsTyp" ADD VALUE 'SEMINAR';
ALTER TYPE "VeranstaltungsTyp" ADD VALUE 'PROJEKT';
ALTER TYPE "VeranstaltungsTyp" ADD VALUE 'ABK_KURSE';
ALTER TYPE "VeranstaltungsTyp" ADD VALUE 'VORLESUNG_UEBUNG';
ALTER TYPE "VeranstaltungsTyp" ADD VALUE 'WISSENSCHAFTLICHER_GRUNDLAGENKURS';
ALTER TYPE "VeranstaltungsTyp" ADD VALUE 'GRUNDKURS';
ALTER TYPE "VeranstaltungsTyp" ADD VALUE 'SPRACHLEHRVERNANSTALTUNG';
ALTER TYPE "VeranstaltungsTyp" ADD VALUE 'KOLLOQUIUM';
ALTER TYPE "VeranstaltungsTyp" ADD VALUE 'FORSCHUNGSKOLLOQUIUM';
