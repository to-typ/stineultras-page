-- Übernimmt den bisher in src/lib/import-export.ts fest verdrahteten
-- Vorlesungszeitraum, damit der ICS-Export für SoSe 26 unverändert bleibt.
UPDATE "Semester"
SET "startDatum" = DATE '2026-05-06',
    "endDatum" = DATE '2026-08-18'
WHERE "name" = 'SoSe 26'
  AND "startDatum" IS NULL
  AND "endDatum" IS NULL;
