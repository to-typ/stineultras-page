-- AlterTable
ALTER TABLE "Modul" ADD COLUMN     "semesterId" INTEGER;

-- AddForeignKey
ALTER TABLE "Modul" ADD CONSTRAINT "Modul_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;
