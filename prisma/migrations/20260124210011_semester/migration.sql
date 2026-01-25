/*
  Warnings:

  - Added the required column `semesterId` to the `Veranstaltung` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Veranstaltung" ADD COLUMN     "semesterId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Semester" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Veranstaltung" ADD CONSTRAINT "Veranstaltung_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
