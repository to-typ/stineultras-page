/*
  Warnings:

  - Added the required column `stineId` to the `Veranstaltung` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stineName` to the `Veranstaltung` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Veranstaltung" ADD COLUMN     "stineId" TEXT NOT NULL,
ADD COLUMN     "stineName" TEXT NOT NULL;
