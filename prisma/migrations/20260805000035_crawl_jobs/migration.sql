-- CreateEnum
CREATE TYPE "CrawlJobTyp" AS ENUM ('VERANSTALTUNGEN', 'MODULE');

-- CreateEnum
CREATE TYPE "CrawlJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'STOPPED', 'ERROR');

-- AlterTable
ALTER TABLE "Semester" ADD COLUMN     "crawlUrl" TEXT,
ADD COLUMN     "modulCrawlUrl" TEXT;

-- CreateTable
CREATE TABLE "CrawlJob" (
    "id" TEXT NOT NULL,
    "typ" "CrawlJobTyp" NOT NULL,
    "status" "CrawlJobStatus" NOT NULL DEFAULT 'PENDING',
    "semesterId" INTEGER NOT NULL,
    "stopRequested" BOOLEAN NOT NULL DEFAULT false,
    "delayBaseMs" INTEGER NOT NULL DEFAULT 1000,
    "delayJitterMs" INTEGER NOT NULL DEFAULT 1000,
    "currentUrl" TEXT,
    "menus" INTEGER NOT NULL DEFAULT 0,
    "veranstaltungen" INTEGER NOT NULL DEFAULT 0,
    "uebungsgruppen" INTEGER NOT NULL DEFAULT 0,
    "termine" INTEGER NOT NULL DEFAULT 0,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "samples" JSONB NOT NULL DEFAULT '[]',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CrawlJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrawlJob_status_idx" ON "CrawlJob"("status");

-- CreateIndex
CREATE INDEX "CrawlJob_createdAt_idx" ON "CrawlJob"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Semester_name_key" ON "Semester"("name");

-- AddForeignKey
ALTER TABLE "CrawlJob" ADD CONSTRAINT "CrawlJob_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Es darf systemweit höchstens einen aktiven Crawl-Job geben.
CREATE UNIQUE INDEX "CrawlJob_single_active"
  ON "CrawlJob" ((1))
  WHERE status IN ('PENDING', 'RUNNING');
