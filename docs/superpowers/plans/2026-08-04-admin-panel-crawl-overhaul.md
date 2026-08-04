# Admin-Panel & Crawl-Jobs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crawl-Jobs werden in der Datenbank verwaltet, pro Semester konfiguriert und im Admin-Panel mit Live-Fortschritt, Durchsatz-Diagrammen und Restzeitschätzung überwacht — ohne hartcodierte URLs oder Semesternamen.

**Architecture:** Die Parse- und Traversierungslogik zieht unverändert aus den beiden Route-Dateien nach `src/lib/crawler/`. Ein `CrawlContext` pro Job trägt Wartezeiten, Abbruchprüfung und Fortschrittszähler durch die Rekursion und schreibt sie gedrosselt in eine neue `CrawlJob`-Tabelle. Die Routes werden dünne Wrapper um `src/lib/crawl-jobs.ts`; das Panel pollt eine einzige Job-API und rendert daraus Fortschritt, KPIs und Recharts-Diagramme.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Prisma + PostgreSQL, Bun (Runtime, Paketmanager, Testrunner), Tailwind + shadcn/ui, recharts, sonner.

**Spec:** `docs/superpowers/specs/2026-08-04-admin-panel-crawl-overhaul-design.md`

## Global Constraints

- **Die Parse-Regexe und die Traversierungsreihenfolge werden nicht verändert.** Code wird verschoben, nicht umgeschrieben. Erlaubte Verhaltensänderungen sind ausschließlich die in Task 4 und Task 5 namentlich gelisteten Bugfixes.
- Alle Imports innerhalb von `src/` nutzen den Alias `@/*`.
- UI-Texte sind auf Deutsch, passend zum bestehenden Panel.
- Keine `alert()`, keine `console.log`-Ausgaben als Nutzerrückmeldung, kein `document.getElementById` im neuen Panel-Code. Rückmeldung läuft über `toast` aus `sonner`.
- Nur ein Crawl-Job darf systemweit gleichzeitig aktiv sein (`PENDING` oder `RUNNING`).
- Standard-Verzögerung beim Crawlen: `delayBaseMs = 1000`, `delayJitterMs = 1000`. Zulässiger Bereich jeweils `0…60000`.
- Prisma-Client nach jeder Schemaänderung mit `bunx prisma generate` neu erzeugen.
- Kommandos laufen über Bun: `bun run dev`, `bun run lint`, `bun test`.

## File Structure

**Neu:**

| Datei | Verantwortung |
| --- | --- |
| `src/lib/crawler/parse.ts` | Reine HTML-Parser: `findSubmenus`, `findVeranstaltungen`, `findTermine`, `findUebungsgruppen`, `getVeranstaltungData`, `getUebungsgruppeData` |
| `src/lib/crawler/veranstaltungs-typ.ts` | `mapVeranstaltungsTyp` |
| `src/lib/crawler/progress.ts` | `computeProgress` — reine Fortschrittsmathematik über den Frame-Stack |
| `src/lib/crawler/context.ts` | `CrawlContext`: Wartezeiten, Abbruchprüfung, Zähler, gedrosselte DB-Writes |
| `src/lib/crawler/db.ts` | Schreibhelfer, die beide Crawler brauchen: `findOrCreateModul`, `linkVeranstaltungToModul` |
| `src/lib/crawler/veranstaltungen.ts` | `crawlVeranstaltungen` samt `crawlMenu`/`crawlVeranstaltung`/`crawlUebungsgruppe`/`crawlTermin` |
| `src/lib/crawler/moduls.ts` | `crawlModule` samt Modul-`crawlMenu` |
| `src/lib/crawl-jobs.ts` | Job-Lebenszyklus: anlegen, starten, listen, stoppen, verwaiste aufräumen |
| `src/lib/crawl-metrics.ts` | Reine Frontend-Mathematik: Raten aus Samples, Restzeitschätzung, Formatierung |
| `src/types/crawl.ts` | DTOs zwischen API und Panel |
| `src/app/api/admin/crawl-jobs/route.ts` | `GET` Liste, `POST` Start |
| `src/app/api/admin/crawl-jobs/[id]/route.ts` | `GET` Einzeljob inkl. Samples |
| `src/app/api/admin/crawl-jobs/[id]/stop/route.ts` | `POST` Stopp anfordern |
| `src/app/api/admin/semesters/route.ts` | `GET` Liste, `POST` anlegen |
| `src/app/api/admin/semesters/[id]/route.ts` | `PATCH` ändern, `DELETE` löschen |
| `src/components/ui/chart.tsx` | shadcn-Recharts-Wrapper |
| `src/hooks/use-crawl-jobs.ts` | Polling-Hook für die Job-API |
| `src/components/admin/start-crawl-card.tsx` | Sektion 1 |
| `src/components/admin/active-job-card.tsx` | Sektion 2 |
| `src/components/admin/job-history-card.tsx` | Sektion 3 |
| `src/components/admin/semester-card.tsx` | Sektion 4 |
| `src/components/admin/system-card.tsx` | Sektion 5 |
| `tests/crawler/*.test.ts`, `tests/crawl-metrics.test.ts` | Bun-Tests der reinen Funktionen |

**Geändert:** `prisma/schema.prisma`, `src/app/admin/panel/page.tsx`, `src/app/admin/layout.tsx`, `src/app/api/admin/reset/route.ts`, `package.json`.

**Gelöscht:** `src/app/api/admin/crawl/route.ts`, `src/app/api/admin/crawl-moduls/route.ts`.

---

### Task 1: Test-Setup und Parse-Funktionen extrahieren

Die Parse-Funktionen sind heute in beiden Route-Dateien identisch dupliziert. Sie sind rein (HTML rein, Daten raus) und damit die einzigen Stellen, die sich ohne Netzwerk und ohne Datenbank testen lassen. Sie kommen zuerst, weil alle folgenden Tasks darauf aufbauen.

**Files:**
- Create: `src/lib/crawler/parse.ts`
- Create: `src/lib/crawler/veranstaltungs-typ.ts`
- Create: `tests/crawler/parse.test.ts`
- Create: `tests/crawler/veranstaltungs-typ.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: nichts
- Produces:
  - `findSubmenus(html: string): Array<{ title: string; href: string }>`
  - `findVeranstaltungen(html: string): Array<{ name: string; url: string }>`
  - `findTermine(html: string): Array<{ date: string; starttime: string; endtime: string; location: string; number: number }>`
  - `findUebungsgruppen(html: string): Array<{ name: string; href: string }>`
  - `getVeranstaltungData(html: string): { type: VeranstaltungsTyp; stineId: string; name: string; stineName: string; person: string }`
  - `getUebungsgruppeData(html: string): { name: string }`
  - `mapVeranstaltungsTyp(type: string): VeranstaltungsTyp`

- [ ] **Step 1: Testrunner-Typen und Skript ergänzen**

`bun test` braucht keine Laufzeit-Dependency, aber `next build` typprüft alle Dateien aus `tsconfig.json` — ohne `@types/bun` schlägt der Build am Import `bun:test` fehl.

```bash
bun add -d @types/bun
```

In `package.json` bei `"scripts"` ergänzen:

```json
    "test": "bun test",
```

- [ ] **Step 2: Test für `mapVeranstaltungsTyp` schreiben**

`tests/crawler/veranstaltungs-typ.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { VeranstaltungsTyp } from "@prisma/client";
import { mapVeranstaltungsTyp } from "@/lib/crawler/veranstaltungs-typ";

describe("mapVeranstaltungsTyp", () => {
  test("bildet bekannte STiNE-Bezeichnungen auf das Enum ab", () => {
    expect(mapVeranstaltungsTyp("Vorlesung")).toBe(VeranstaltungsTyp.VORLESUNG);
    expect(mapVeranstaltungsTyp("Proseminar")).toBe(VeranstaltungsTyp.PROSEMINAR);
    expect(mapVeranstaltungsTyp("Übung")).toBe(VeranstaltungsTyp.UEBUNG);
    expect(mapVeranstaltungsTyp("Vorlesung + Übung")).toBe(VeranstaltungsTyp.VORLESUNG_UEBUNG);
  });

  test("liefert UNDEFINED für Unbekanntes", () => {
    expect(mapVeranstaltungsTyp("Gibt es nicht")).toBe(VeranstaltungsTyp.UNDEFINED);
    expect(mapVeranstaltungsTyp("")).toBe(VeranstaltungsTyp.UNDEFINED);
  });
});
```

- [ ] **Step 3: Test laufen lassen, Fehlschlag bestätigen**

Run: `bun test tests/crawler/veranstaltungs-typ.test.ts`
Expected: FAIL — `Cannot find module '@/lib/crawler/veranstaltungs-typ'`

- [ ] **Step 4: `veranstaltungs-typ.ts` anlegen**

Den kompletten `mapVeranstaltungsTyp`-Block aus `src/app/api/admin/crawl/route.ts:455-651` **unverändert** nach `src/lib/crawler/veranstaltungs-typ.ts` verschieben. Kopf der neuen Datei:

```ts
import { VeranstaltungsTyp } from "@prisma/client";

export function mapVeranstaltungsTyp(type: string): VeranstaltungsTyp {
  switch (type) {
    case "ABK-Kurse":
      return VeranstaltungsTyp.ABK_KURSE;
    // ... sämtliche übrigen 90 cases exakt wie in der Ursprungsdatei ...
    default:
      return VeranstaltungsTyp.UNDEFINED;
  }
}
```

Kein `case` weglassen, keine Bezeichnung anfassen — die Strings entsprechen 1:1 dem, was STiNE ausliefert.

- [ ] **Step 5: Test laufen lassen, Erfolg bestätigen**

Run: `bun test tests/crawler/veranstaltungs-typ.test.ts`
Expected: PASS, 2 Tests

- [ ] **Step 6: Tests für die Parse-Funktionen schreiben**

`tests/crawler/parse.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { VeranstaltungsTyp } from "@prisma/client";
import {
  findSubmenus,
  findTermine,
  findUebungsgruppen,
  findVeranstaltungen,
  getUebungsgruppeData,
  getVeranstaltungData,
} from "@/lib/crawler/parse";

describe("findSubmenus", () => {
  test("liest Titel und Href aus der auditRegistrationList", () => {
    const html = `
      <ul class="auditRegistrationList" id="x">
        <li><a class="auditRegNodeLink" href="/a?x=1&amp;y=2"> Informatik </a></li>
        <li><a class="auditRegNodeLink" href="/b"> Mathematik </a></li>
      </ul>`;

    expect(findSubmenus(html)).toEqual([
      { title: "Informatik", href: "/a?x=1&y=2" },
      { title: "Mathematik", href: "/b" },
    ]);
  });

  test("liefert eine leere Liste, wenn keine Liste vorhanden ist", () => {
    expect(findSubmenus("<html><body>nichts</body></html>")).toEqual([]);
  });
});

describe("findVeranstaltungen", () => {
  test("liest Name und URL aus den eventLink-Ankern", () => {
    const html = `
      <a name="eventLink" href="/kurs?id=1&amp;s=2"> 64-100 Mathematik I </a>
      <a name="eventLink" href="/kurs?id=2"> 64-101 Analysis </a>`;

    expect(findVeranstaltungen(html)).toEqual([
      { name: "64-100 Mathematik I", url: "/kurs?id=1&s=2" },
      { name: "64-101 Analysis", url: "/kurs?id=2" },
    ]);
  });
});

describe("findTermine", () => {
  test("zerlegt Datum, Zeit und Raum aus dem title-Attribut", () => {
    const html = `
      <div class="courseListCell dl-inner" title="Mo, 6. Okt. 2025 / 10:15 - 11:45 / Raum ABC 123" >
        <span class="nr">1<span></span></span>
      </div>`;

    expect(findTermine(html)).toEqual([
      {
        date: "2025-10-06",
        starttime: "10:15",
        endtime: "11:45",
        location: "Raum ABC 123",
        number: 1,
      },
    ]);
  });

  test("füllt einstellige Tage auf und übersetzt deutsche Monatskürzel", () => {
    const html = `
      <div class="courseListCell" title="Di, 3. Mär. 2026 / 08:00 - 09:30 / Online" >
        <span>12<span></span></span>
      </div>`;

    const termine = findTermine(html);
    expect(termine[0].date).toBe("2026-03-03");
    expect(termine[0].number).toBe(12);
  });

  test("überspringt Einträge ohne Raumangabe", () => {
    const html = `
      <div class="courseListCell" title="Mi, 7. Okt. 2025 / 10:15 - 11:45" >
        <span>1<span></span></span>
      </div>`;

    expect(findTermine(html)).toEqual([]);
  });
});

describe("findUebungsgruppen", () => {
  test("verbindet Gruppennamen mit dem zugehörigen Link", () => {
    const html = `
      <ul class="dl-ul-listview">
        <li>
          <p class="dl-ul-li-headline"><strong>Gruppe 1</strong></p>
          <a href="/gruppe?id=1&amp;x=2">
            Kleingruppe anzeigen
          </a>
        </li>
        <li>
          <p class="dl-ul-li-headline"><strong>Gruppe 2</strong></p>
          <a href="/gruppe?id=2"> Kleingruppe anzeigen </a>
        </li>
      </ul>`;

    expect(findUebungsgruppen(html)).toEqual([
      { name: "Gruppe 1", href: "/gruppe?id=1&x=2" },
      { name: "Gruppe 2", href: "/gruppe?id=2" },
    ]);
  });
});

describe("getVeranstaltungData", () => {
  test("liest StiNE-ID, Name, Typ, Stundenplanname und Lehrende", () => {
    const html = `
      <h1> 64-100 Mathematik I </h1>
      <span id="dozenten">Prof. Dr. Beispiel</span>
      <p>Veranstaltungsart:</p><div class="v"> Vorlesung
      </div>
      <p>Anzeige im Stundenplan: </p><div class="v"> Mathe I
      </div>`;

    expect(getVeranstaltungData(html)).toEqual({
      type: VeranstaltungsTyp.VORLESUNG,
      stineId: "64-100",
      name: "Mathematik I",
      stineName: "Mathe I",
      person: "Prof. Dr. Beispiel",
    });
  });

  test("fällt auf leere Werte und UNDEFINED zurück, wenn nichts passt", () => {
    expect(getVeranstaltungData("<html></html>")).toEqual({
      type: VeranstaltungsTyp.UNDEFINED,
      stineId: "",
      name: "",
      stineName: "",
      person: "",
    });
  });
});

describe("getUebungsgruppeData", () => {
  test("liest den Gruppennamen aus der Überschrift", () => {
    expect(getUebungsgruppeData('<h2 class="x"> Kleingruppe: Gruppe 1 </h2>')).toEqual({
      name: "Gruppe 1",
    });
  });

  test("liefert einen leeren Namen ohne passende Überschrift", () => {
    expect(getUebungsgruppeData("<h2>Etwas anderes</h2>")).toEqual({ name: "" });
  });
});
```

- [ ] **Step 7: Tests laufen lassen, Fehlschlag bestätigen**

Run: `bun test tests/crawler/parse.test.ts`
Expected: FAIL — `Cannot find module '@/lib/crawler/parse'`

- [ ] **Step 8: `parse.ts` anlegen**

Die sechs Funktionen aus `src/app/api/admin/crawl/route.ts` **unverändert** übernehmen und exportieren:

- `findSubmenus` — Zeilen 254-275
- `findVeranstaltungen` — Zeilen 277-292
- `findTermine` — Zeilen 294-357
- `findUebungsgruppen` — Zeilen 359-389
- `getUebungsgruppeData` — Zeilen 400-409
- `getVeranstaltungData` — Zeilen 411-453

Jede Funktion bekommt ein `export` vorangestellt, sonst bleibt der Rumpf Zeichen für Zeichen gleich. `getVeranstaltungData` importiert `mapVeranstaltungsTyp` aus der Nachbardatei:

```ts
import { VeranstaltungsTyp } from "@prisma/client";
import { mapVeranstaltungsTyp } from "@/lib/crawler/veranstaltungs-typ";
```

Die Rückgabetypen sind identisch mit denen in der Ursprungsdatei; sie bleiben inline annotiert wie dort.

- [ ] **Step 9: Tests laufen lassen, Erfolg bestätigen**

Run: `bun test`
Expected: PASS, alle Tests aus beiden Dateien

Falls ein Test fehlschlägt: **nicht den Produktivcode anpassen**, sondern die Erwartung im Test an das tatsächliche Verhalten der unveränderten Regex angleichen. Ziel dieser Tests ist, den Ist-Zustand festzuschreiben, nicht ihn zu verbessern.

- [ ] **Step 10: Lint und Commit**

```bash
bun run lint
git add package.json bun.lockb src/lib/crawler tests/crawler
git commit -m "refactor: Parse-Funktionen des Crawlers nach src/lib/crawler extrahieren"
```

---

### Task 2: Datenmodell — `Semester`-Felder, `CrawlJob`-Tabelle, Ein-Job-Sperre

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_crawl_jobs/migration.sql` (von Prisma erzeugt, danach von Hand ergänzt)

**Interfaces:**
- Consumes: nichts
- Produces: Prisma-Modelle `CrawlJob`, Enums `CrawlJobTyp`, `CrawlJobStatus`, Felder `Semester.crawlUrl`, `Semester.modulCrawlUrl`, Unique-Constraint auf `Semester.name`

- [ ] **Step 1: Auf Duplikat-Semester prüfen**

Weil `crawlSemester` bisher bei jedem Lauf ein `semester.create` ausgeführt hat, können mehrere Semester denselben Namen tragen. Das würde die Migration abbrechen.

```bash
bunx prisma db execute --stdin <<'SQL'
SELECT name, count(*) FROM "Semester" GROUP BY name HAVING count(*) > 1;
SQL
```

Alternativ in `bunx prisma studio` nachsehen. Werden Duplikate gefunden: pro Namen ein Semester als führend wählen, die `semesterId` der Veranstaltungen und Module der übrigen darauf umhängen, dann die leer gewordenen Semester löschen. **Erst danach weitermachen.**

- [ ] **Step 2: Schema erweitern**

In `prisma/schema.prisma` das `Semester`-Modell ersetzen:

```prisma
model Semester {
  id              Int             @id @default(autoincrement())
  name            String          @unique
  isSelectable    Boolean         @default(true)
  crawlUrl        String?
  modulCrawlUrl   String?
  veranstaltungen Veranstaltung[]
  module          Modul[]
  crawlJobs       CrawlJob[]
}
```

Und am Ende des Schemas ergänzen:

```prisma
model CrawlJob {
  id            String         @id @default(cuid())
  typ           CrawlJobTyp
  status        CrawlJobStatus @default(PENDING)
  semesterId    Int
  semester      Semester       @relation(fields: [semesterId], references: [id])

  stopRequested Boolean        @default(false)

  delayBaseMs   Int            @default(1000)
  delayJitterMs Int            @default(1000)

  currentUrl      String?
  menus           Int          @default(0)
  veranstaltungen Int          @default(0)
  uebungsgruppen  Int          @default(0)
  termine         Int          @default(0)
  requests        Int          @default(0)
  progress        Float        @default(0)
  samples         Json         @default("[]")

  error         String?
  createdAt     DateTime       @default(now())
  startedAt     DateTime?
  completedAt   DateTime?

  @@index([status])
  @@index([createdAt])
}

enum CrawlJobTyp {
  VERANSTALTUNGEN
  MODULE
}

enum CrawlJobStatus {
  PENDING
  RUNNING
  COMPLETED
  STOPPED
  ERROR
}
```

- [ ] **Step 3: Migration erzeugen, aber noch nicht anwenden**

```bash
bunx prisma migrate dev --name crawl_jobs --create-only
```

- [ ] **Step 4: Ein-Job-Sperre als partiellen Unique-Index ergänzen**

Zwei gleichzeitige `POST`-Requests könnten bei einer reinen „erst zählen, dann anlegen"-Prüfung beide durchrutschen. Postgres kann die Regel selbst durchsetzen: ein Unique-Index über einen konstanten Ausdruck, eingeschränkt auf aktive Jobs, lässt höchstens eine solche Zeile zu.

Ans Ende der erzeugten `migration.sql` anhängen:

```sql
-- Es darf systemweit höchstens einen aktiven Crawl-Job geben.
CREATE UNIQUE INDEX "CrawlJob_single_active"
  ON "CrawlJob" ((1))
  WHERE status IN ('PENDING', 'RUNNING');
```

- [ ] **Step 5: Migration anwenden und Client erzeugen**

```bash
bunx prisma migrate dev
bunx prisma generate
```

Expected: Migration läuft durch. Bricht sie an der Unique-Constraint auf `Semester.name` ab, ist Step 1 unvollständig erledigt.

- [ ] **Step 6: Sperre und Modell manuell prüfen**

```bash
bunx prisma db execute --stdin <<'SQL'
INSERT INTO "Semester" (name, "isSelectable") VALUES ('__test__', false)
  ON CONFLICT (name) DO NOTHING;
INSERT INTO "CrawlJob" (id, typ, status, "semesterId")
  SELECT 'test-a', 'VERANSTALTUNGEN', 'RUNNING', id FROM "Semester" WHERE name = '__test__';
INSERT INTO "CrawlJob" (id, typ, status, "semesterId")
  SELECT 'test-b', 'MODULE', 'PENDING', id FROM "Semester" WHERE name = '__test__';
SQL
```

Expected: Das zweite `INSERT` scheitert mit `duplicate key value violates unique constraint "CrawlJob_single_active"`.

Danach aufräumen:

```bash
bunx prisma db execute --stdin <<'SQL'
DELETE FROM "CrawlJob" WHERE id IN ('test-a', 'test-b');
DELETE FROM "Semester" WHERE name = '__test__';
SQL
```

- [ ] **Step 7: Commit**

```bash
git add prisma
git commit -m "feat: CrawlJob-Modell und Crawl-URLs am Semester"
```

---

### Task 3: Fortschrittsmathematik und `CrawlContext`

**Files:**
- Create: `src/lib/crawler/progress.ts`
- Create: `src/lib/crawler/context.ts`
- Create: `tests/crawler/progress.test.ts`

**Interfaces:**
- Consumes: Prisma-Modell `CrawlJob` (Task 2)
- Produces:
  - `type ProgressFrame = { index: number; total: number }`
  - `computeProgress(frames: ProgressFrame[]): number`
  - `type CrawlSample = { t: number; r: number; v: number; d: number; p: number }`
  - `class CrawlContext` mit `wait()`, `shouldStop()`, `enterMenu(total)`, `advanceMenu()`, `exitMenu()`, `trackRequest(url)`, `trackVeranstaltung()`, `trackUebungsgruppe()`, `trackTermine(n)`, `flush(force?)`
  - `createCrawlContext(jobId, delayBaseMs, delayJitterMs): CrawlContext`

- [ ] **Step 1: Test für `computeProgress` schreiben**

`tests/crawler/progress.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { computeProgress } from "@/lib/crawler/progress";

describe("computeProgress", () => {
  test("liefert 0 ohne Frames", () => {
    expect(computeProgress([])).toBe(0);
  });

  test("nutzt auf oberster Ebene den reinen Indexanteil", () => {
    expect(computeProgress([{ index: 3, total: 12 }])).toBeCloseTo(0.25, 10);
  });

  test("gewichtet tiefere Ebenen mit dem Kehrwert der Elterngrößen", () => {
    // 2 von 12 Wurzelknoten fertig, im dritten 6 von 20 erledigt
    const p = computeProgress([
      { index: 2, total: 12 },
      { index: 6, total: 20 },
    ]);
    expect(p).toBeCloseTo(2 / 12 + (1 / 12) * (6 / 20), 10);
  });

  test("überspringt Frames ohne Kinder, statt durch null zu teilen", () => {
    const p = computeProgress([
      { index: 1, total: 2 },
      { index: 0, total: 0 },
      { index: 1, total: 4 },
    ]);
    expect(p).toBeCloseTo(0.5 + 0.5 * 0.25, 10);
  });

  test("bleibt zwischen 0 und 1, auch wenn der Index den Umfang übersteigt", () => {
    expect(computeProgress([{ index: 99, total: 12 }])).toBe(1);
  });
});
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag bestätigen**

Run: `bun test tests/crawler/progress.test.ts`
Expected: FAIL — `Cannot find module '@/lib/crawler/progress'`

- [ ] **Step 3: `progress.ts` implementieren**

```ts
export type ProgressFrame = {
  /** Wie viele Geschwister auf dieser Ebene bereits abgearbeitet sind. */
  index: number;
  /** Wie viele Geschwister es auf dieser Ebene insgesamt gibt. */
  total: number;
};

/**
 * Anteil des bereits abgearbeiteten Menübaums, abgeleitet aus der Position im
 * Baum. Jede Ebene trägt ihren Indexanteil bei, gewichtet mit dem Kehrwert
 * aller darüberliegenden Ebenen — der zweite Knoten einer 12er-Ebene ist eben
 * nur ein Zwölftel wert.
 *
 * Setzt voraus, dass Geschwisterteilbäume ähnlich groß sind. Das stimmt nie
 * exakt, korrigiert sich mit zunehmender Tiefe aber selbst.
 */
export function computeProgress(frames: ProgressFrame[]): number {
  let progress = 0;
  let weight = 1;

  for (const frame of frames) {
    if (frame.total <= 0) {
      continue;
    }
    progress += weight * (frame.index / frame.total);
    weight = weight / frame.total;
  }

  return Math.min(1, Math.max(0, progress));
}
```

- [ ] **Step 4: Tests laufen lassen, Erfolg bestätigen**

Run: `bun test tests/crawler/progress.test.ts`
Expected: PASS, 5 Tests

- [ ] **Step 5: `context.ts` implementieren**

```ts
import { prisma } from "@/lib/prisma";
import { computeProgress, type ProgressFrame } from "@/lib/crawler/progress";

/** Ein Messpunkt für die Durchsatz-Diagramme im Panel. Kumulative Werte. */
export type CrawlSample = {
  /** Millisekunden seit Jobstart. */
  t: number;
  /** Requests gesamt. */
  r: number;
  /** Veranstaltungen gesamt. */
  v: number;
  /** Termine gesamt. */
  d: number;
  /** Fortschrittsbruch 0…1. */
  p: number;
};

const COUNTER_FLUSH_MS = 2000;
const SAMPLE_INTERVAL_MS = 30000;

/**
 * Trägt Wartezeiten, Abbruchprüfung und Fortschrittszählung durch die
 * rekursiven Crawl-Funktionen. Zähler werden im Speicher gehalten und
 * höchstens alle zwei Sekunden geschrieben, damit nicht jeder HTTP-Request
 * einen DB-Write auslöst.
 */
export class CrawlContext {
  private frames: ProgressFrame[] = [];
  private samples: CrawlSample[] = [];
  private startedAt = Date.now();
  private lastFlush = 0;
  private lastSample = 0;
  private stopCache = false;

  private menus = 0;
  private veranstaltungen = 0;
  private uebungsgruppen = 0;
  private termine = 0;
  private requests = 0;
  private currentUrl: string | null = null;

  constructor(
    readonly jobId: string,
    private readonly delayBaseMs: number,
    private readonly delayJitterMs: number,
  ) {}

  /** Ersetzt das feste setTimeout aus dem alten Crawler. */
  async wait(): Promise<void> {
    const ms = this.delayBaseMs + Math.random() * this.delayJitterMs;
    if (ms <= 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Liest den zwischengespeicherten Stopp-Wunsch; aufgefrischt beim Flush. */
  async shouldStop(): Promise<boolean> {
    await this.flush();
    return this.stopCache;
  }

  enterMenu(total: number): void {
    this.frames.push({ index: 0, total });
  }

  advanceMenu(): void {
    const frame = this.frames[this.frames.length - 1];
    if (frame) {
      frame.index += 1;
    }
  }

  exitMenu(): void {
    this.frames.pop();
  }

  trackRequest(url: string): void {
    this.requests += 1;
    this.currentUrl = url;
  }

  trackMenu(): void {
    this.menus += 1;
  }

  trackVeranstaltung(): void {
    this.veranstaltungen += 1;
  }

  trackUebungsgruppe(): void {
    this.uebungsgruppen += 1;
  }

  trackTermine(n: number): void {
    this.termine += n;
  }

  /**
   * Schreibt Zähler und Fortschritt in die Job-Zeile und liest dabei den
   * Stopp-Wunsch mit. Ein Fehler hier darf einen stundenlangen Lauf nicht
   * abbrechen, deshalb wird er nur geloggt.
   */
  async flush(force = false): Promise<void> {
    const now = Date.now();
    if (!force && now - this.lastFlush < COUNTER_FLUSH_MS) {
      return;
    }
    this.lastFlush = now;

    const progress = computeProgress(this.frames);

    if (force || now - this.lastSample >= SAMPLE_INTERVAL_MS) {
      this.lastSample = now;
      this.samples.push({
        t: now - this.startedAt,
        r: this.requests,
        v: this.veranstaltungen,
        d: this.termine,
        p: progress,
      });
    }

    try {
      const job = await prisma.crawlJob.update({
        where: { id: this.jobId },
        data: {
          menus: this.menus,
          veranstaltungen: this.veranstaltungen,
          uebungsgruppen: this.uebungsgruppen,
          termine: this.termine,
          requests: this.requests,
          progress,
          currentUrl: this.currentUrl,
          samples: this.samples,
        },
        select: { stopRequested: true },
      });
      this.stopCache = job.stopRequested;
    } catch (error) {
      console.error(`Fortschritt für Job ${this.jobId} konnte nicht geschrieben werden:`, error);
    }
  }
}

export function createCrawlContext(
  jobId: string,
  delayBaseMs: number,
  delayJitterMs: number,
): CrawlContext {
  return new CrawlContext(jobId, delayBaseMs, delayJitterMs);
}
```

- [ ] **Step 6: Typprüfung und Lint**

Run: `bunx tsc --noEmit && bun run lint`
Expected: keine Fehler

- [ ] **Step 7: Commit**

```bash
git add src/lib/crawler/progress.ts src/lib/crawler/context.ts tests/crawler/progress.test.ts
git commit -m "feat: CrawlContext mit Fortschrittsberechnung und gedrosselten Writes"
```

---

### Task 4: Veranstaltungs-Crawler nach `src/lib/crawler/veranstaltungen.ts`

Traversierung und Datenbankzugriffe werden übernommen wie sie sind. Geändert werden ausschließlich: die Wartezeit kommt vom Context, die Abbruchprüfung ebenfalls, das Semester wird nicht mehr angelegt sondern übergeben, und Module werden nicht mehr doppelt erzeugt.

**Files:**
- Create: `src/lib/crawler/db.ts`
- Create: `src/lib/crawler/veranstaltungen.ts`

**Interfaces:**
- Consumes: `CrawlContext` (Task 3), `parse.ts` (Task 1)
- Produces:
  - `findOrCreateModul(name: string, semesterId: number): Promise<Modul>`
  - `linkVeranstaltungToModul(veranstaltungsId: number, modulId: number): Promise<void>`
  - `crawlVeranstaltungen(ctx: CrawlContext, url: string, semesterId: number): Promise<void>`

- [ ] **Step 1: Gemeinsame Schreibhelfer anlegen**

Beide Crawler legen Module an und verknüpfen sie mit Veranstaltungen. Damit die Dublettenprüfung nur an einer Stelle existiert, liegen die Helfer in einer eigenen Datei.

`src/lib/crawler/db.ts`:

```ts
import { prisma } from "@/lib/prisma";

/**
 * Beim Ergänzen eines bereits gecrawlten Semesters darf kein zweiter Satz
 * Module entstehen — deshalb erst suchen, dann anlegen. Entspricht der
 * stineId-Prüfung bei Veranstaltungen.
 */
export async function findOrCreateModul(name: string, semesterId: number) {
  const existing = await prisma.modul.findFirst({ where: { name, semesterId } });
  if (existing) {
    return existing;
  }
  return prisma.modul.create({
    data: { name, semester: { connect: { id: semesterId } } },
  });
}

/** Verhindert doppelte Verknüpfungen beim erneuten Crawlen. */
export async function linkVeranstaltungToModul(
  veranstaltungsId: number,
  modulId: number,
): Promise<void> {
  const existing = await prisma.veranstaltungInModul.findFirst({
    where: { veranstaltungsId, modulId },
  });
  if (existing) {
    return;
  }
  await prisma.veranstaltungInModul.create({
    data: {
      modul: { connect: { id: modulId } },
      veranstaltung: { connect: { id: veranstaltungsId } },
    },
  });
}
```

- [ ] **Step 2: Crawler-Datei anlegen**

`src/lib/crawler/veranstaltungen.ts`:

```ts
import { prisma } from "@/lib/prisma";
import type { CrawlContext } from "@/lib/crawler/context";
import { findOrCreateModul, linkVeranstaltungToModul } from "@/lib/crawler/db";
import {
  findTermine,
  findUebungsgruppen,
  findVeranstaltungen,
  findSubmenus,
  getUebungsgruppeData,
  getVeranstaltungData,
} from "@/lib/crawler/parse";

const stineBaseURL = "https://www.stine.uni-hamburg.de";

/** Einstiegspunkt: crawlt den kompletten Menübaum eines Semesters. */
export async function crawlVeranstaltungen(
  ctx: CrawlContext,
  url: string,
  semesterId: number,
): Promise<void> {
  await crawlMenu(ctx, "Übersicht", url, semesterId);
  await ctx.flush(true);
}

async function fetchHtml(ctx: CrawlContext, url: string): Promise<string> {
  await ctx.wait();
  ctx.trackRequest(url);
  console.log(`Crawling: ${url}`);
  const response = await fetch(url, { method: "GET" });
  return await response.text();
}

async function crawlMenu(
  ctx: CrawlContext,
  name: string,
  url: string,
  semesterId: number,
): Promise<void> {
  if (!url) {
    console.log(`Crawling menu: null url`);
    return;
  }

  const html = await fetchHtml(ctx, url);
  ctx.trackMenu();

  if (!html.includes("auditRegistrationList") || html.includes("Veranstaltungen / Module")) {
    const veranstaltungen = findVeranstaltungen(html);
    if (veranstaltungen.length > 0) {
      const modul = await findOrCreateModul(name, semesterId);

      for (const veranstaltung of veranstaltungen) {
        const id = await crawlVeranstaltung(ctx, stineBaseURL + veranstaltung.url, semesterId);

        if (id) {
          await linkVeranstaltungToModul(id, modul.id);
        }
      }
    }
  }

  if (html.includes("auditRegistrationList")) {
    const submenuLinks = findSubmenus(html);
    ctx.enterMenu(submenuLinks.length);
    for (const submenu of submenuLinks) {
      if (await ctx.shouldStop()) {
        break;
      }
      await crawlMenu(ctx, submenu.title, stineBaseURL + submenu.href, semesterId);
      ctx.advanceMenu();
    }
    ctx.exitMenu();
  }
}

async function crawlVeranstaltung(
  ctx: CrawlContext,
  url: string,
  semesterId: number,
): Promise<number | null> {
  if (!url) {
    console.log(`Crawling event: null url`);
    return null;
  }

  const html = await fetchHtml(ctx, url);
  const eventData = getVeranstaltungData(html);

  const existing = await prisma.veranstaltung.findMany({
    where: { stineId: eventData.stineId, semesterId: semesterId },
  });
  if (existing.length > 0 && eventData.stineId) {
    return existing[0].id;
  }

  const result = await prisma.veranstaltung.create({
    data: {
      name: eventData.name,
      stineId: eventData.stineId,
      typ: eventData.type,
      stineName: eventData.stineName,
      lehrende: eventData.person,
      url: url,
      semester: { connect: { id: semesterId } },
    },
  });
  ctx.trackVeranstaltung();

  if (html.includes("Kleingruppe(n)")) {
    const subgroups = findUebungsgruppen(html);
    for (const subgroup of subgroups) {
      await crawlUebungsgruppe(ctx, stineBaseURL + subgroup.href, result.id);
    }
  } else {
    await crawlTermin(ctx, html, undefined, result.id);
  }
  return result.id;
}

async function crawlUebungsgruppe(
  ctx: CrawlContext,
  url: string,
  eventId: number,
): Promise<void> {
  if (!url) {
    return;
  }

  const html = await fetchHtml(ctx, url);
  const uebungsgruppeData = getUebungsgruppeData(html);
  const subgroup = await prisma.uebungsgruppe.create({
    data: {
      name: uebungsgruppeData.name,
      veranstaltung: { connect: { id: eventId } },
    },
  });
  ctx.trackUebungsgruppe();
  await crawlTermin(ctx, html, subgroup.id, undefined);
}

async function crawlTermin(
  ctx: CrawlContext,
  html: string,
  subgroupId?: number,
  eventId?: number,
): Promise<void> {
  const dates = findTermine(html);
  for (const date of dates) {
    // Behandle die Zeiten als UTC (ohne Timezone-Konvertierung)
    // da STiNE Berliner Zeit anzeigt und wir die direkt speichern wollen
    const tagDate = new Date(date.date + "T" + date.starttime + "Z");
    const startZeit = new Date(date.date + "T" + date.starttime + "Z");
    const endZeit = new Date(date.date + "T" + date.endtime + "Z");

    if (subgroupId === undefined && eventId !== undefined) {
      await prisma.termin.create({
        data: {
          tag: tagDate,
          veranstaltung: { connect: { id: eventId } },
          nummer: date.number,
          raum: date.location,
          startZeit: startZeit,
          endZeit: endZeit,
        },
      });
    } else if (subgroupId !== undefined) {
      await prisma.termin.create({
        data: {
          tag: tagDate,
          uebung: { connect: { id: subgroupId } },
          nummer: date.number,
          raum: date.location,
          startZeit: startZeit,
          endZeit: endZeit,
        },
      });
    }
  }
  ctx.trackTermine(dates.length);
}
```

**Was sich gegenüber `src/app/api/admin/crawl/route.ts` bewusst geändert hat — und sonst nichts:**

1. Kein `prisma.semester.create` mehr; `semesterId` kommt vom Job.
2. `crawlStopFlag` → `ctx.shouldStop()`.
3. `setTimeout(standardTimeout + …)` → `ctx.wait()`.
4. Zählaufrufe (`trackMenu`, `trackVeranstaltung`, `trackUebungsgruppe`, `trackTermine`, `trackRequest`) und Frame-Verwaltung (`enterMenu`/`advanceMenu`/`exitMenu`) ergänzt.
5. Module und Modul-Verknüpfungen werden gesucht statt blind angelegt (`findOrCreateModul`, `linkVeranstaltungToModul` aus `db.ts`).
6. Die Rückgabe des Submenü-Baums entfällt. Sie wurde nie verwendet: `crawlSemester`s Ergebnis landete in einer Variablen mit `eslint-disable no-unused-vars`, und das `searchTree`-Feld am alten `Job`-Typ wurde nie beschrieben.

Regexe, Reihenfolge der Traversierung, Abbruchbedingungen (`html.includes(...)`) und die Datums-/Zeitbehandlung sind unverändert.

- [ ] **Step 3: Typprüfung und Lint**

Run: `bunx tsc --noEmit && bun run lint`
Expected: keine Fehler

- [ ] **Step 4: Commit**

```bash
git add src/lib/crawler/db.ts src/lib/crawler/veranstaltungen.ts
git commit -m "refactor: Veranstaltungs-Crawler in eigenes Modul mit CrawlContext"
```

---

### Task 5: Modul-Crawler nach `src/lib/crawler/moduls.ts`

**Files:**
- Create: `src/lib/crawler/moduls.ts`

**Interfaces:**
- Consumes: `CrawlContext` (Task 3), `parse.ts` (Task 1), `findOrCreateModul` und `linkVeranstaltungToModul` aus `db.ts` (Task 4)
- Produces: `crawlModule(ctx: CrawlContext, url: string, semesterId: number): Promise<void>`

- [ ] **Step 1: Datei anlegen**

`src/lib/crawler/moduls.ts`:

```ts
import { prisma } from "@/lib/prisma";
import type { CrawlContext } from "@/lib/crawler/context";
import { findOrCreateModul, linkVeranstaltungToModul } from "@/lib/crawler/db";
import { findSubmenus, findVeranstaltungen } from "@/lib/crawler/parse";

const stineBaseURL = "https://www.stine.uni-hamburg.de";

/**
 * Zweiter Crawl-Durchgang: läuft denselben Menübaum ab, legt aber nur Module
 * an und verknüpft sie mit bereits vorhandenen Veranstaltungen.
 */
export async function crawlModule(
  ctx: CrawlContext,
  url: string,
  semesterId: number,
): Promise<void> {
  await crawlMenu(ctx, "Übersicht", url, semesterId);
  await ctx.flush(true);
}

async function crawlMenu(
  ctx: CrawlContext,
  name: string,
  url: string,
  semesterId: number,
): Promise<void> {
  if (!url) {
    console.log(`Crawling menu: null url`);
    return;
  }

  await ctx.wait();
  ctx.trackRequest(url);
  console.log(`Crawling menu: ${url}`);

  const response = await fetch(url, { method: "GET" });
  const html = await response.text();
  ctx.trackMenu();

  if (!html.includes("auditRegistrationList") || html.includes("Veranstaltungen / Module")) {
    const modul = await findOrCreateModul(name, semesterId);

    const veranstaltungen = findVeranstaltungen(html);
    for (const veranstaltung of veranstaltungen) {
      const stineId = veranstaltung.name.split(" ")[0];

      const stineVeranstaltung = await prisma.veranstaltung.findFirst({
        where: { stineId: stineId, semesterId: semesterId },
      });
      if (stineVeranstaltung) {
        await linkVeranstaltungToModul(stineVeranstaltung.id, modul.id);
        ctx.trackVeranstaltung();
      }
    }
  }

  if (html.includes("auditRegistrationList")) {
    const submenuLinks = findSubmenus(html);
    ctx.enterMenu(submenuLinks.length);
    for (const submenu of submenuLinks) {
      if (await ctx.shouldStop()) {
        break;
      }
      await crawlMenu(ctx, submenu.title, stineBaseURL + submenu.href, semesterId);
      ctx.advanceMenu();
    }
    ctx.exitMenu();
  }
}
```

**Was sich gegenüber `src/app/api/admin/crawl-moduls/route.ts` bewusst geändert hat:**

1. `const semId = 5` entfällt; die `semesterId` kommt vom Job.
2. Der `switch` über Semesternamen entfällt komplett — damit auch der Bug der fehlenden `break`, durch den `"WiSe 25/26"` auf die SoSe-26-URL durchfiel.
3. `prisma.modul.create` verknüpft jetzt das Semester (fehlte bisher vollständig — Module landeten ohne Semesterbezug in der DB).
4. Die Suche nach der passenden Veranstaltung ist auf das Semester eingeschränkt (`semesterId` im `where`). Ohne das verknüpft ein Modul-Crawl von Semester X Veranstaltungen aus Semester Y — die `stineId` ist über Semester hinweg nicht eindeutig.
5. Module und Verknüpfungen werden gesucht statt blind angelegt — über die gemeinsamen Helfer aus `db.ts` (Task 4), nicht über eine zweite Kopie.
6. `crawlStopFlag` → `ctx.shouldStop()`, feste Timeouts → `ctx.wait()`, Zähler und Frames ergänzt.

- [ ] **Step 2: Typprüfung und Lint**

Run: `bunx tsc --noEmit && bun run lint`
Expected: keine Fehler

- [ ] **Step 3: Commit**

```bash
git add src/lib/crawler/moduls.ts
git commit -m "refactor: Modul-Crawler in eigenes Modul, Semester-Verknüpfung korrigiert"
```

---

### Task 6: Job-Lebenszyklus in `src/lib/crawl-jobs.ts`

**Files:**
- Create: `src/types/crawl.ts`
- Create: `src/lib/crawl-jobs.ts`

**Interfaces:**
- Consumes: `crawlVeranstaltungen` (Task 4), `crawlModule` (Task 5), `createCrawlContext` (Task 3)
- Produces:
  - `type CrawlJobDto`, `type SemesterDto`, `type CrawlSampleDto` in `@/types/crawl`
  - `reconcileOrphans(): Promise<void>`
  - `listJobs(): Promise<{ active: CrawlJobDto | null; history: CrawlJobDto[] }>`
  - `getJob(id: string): Promise<CrawlJobDto | null>`
  - `startJob(input: StartJobInput): Promise<{ ok: true; job: CrawlJobDto } | { ok: false; code: "BUSY" | "NO_URL" | "BAD_DELAY" | "NO_SEMESTER"; message: string }>`
  - `stopJob(id: string): Promise<boolean>`

- [ ] **Step 1: DTOs anlegen**

`src/types/crawl.ts`:

```ts
export type CrawlJobTyp = "VERANSTALTUNGEN" | "MODULE";

export type CrawlJobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "STOPPED" | "ERROR";

export type CrawlSampleDto = {
  /** Millisekunden seit Jobstart. */
  t: number;
  /** Requests kumulativ. */
  r: number;
  /** Veranstaltungen kumulativ. */
  v: number;
  /** Termine kumulativ. */
  d: number;
  /** Fortschrittsbruch 0…1. */
  p: number;
};

export type CrawlJobDto = {
  id: string;
  typ: CrawlJobTyp;
  status: CrawlJobStatus;
  semesterId: number;
  semesterName: string;
  stopRequested: boolean;
  delayBaseMs: number;
  delayJitterMs: number;
  currentUrl: string | null;
  menus: number;
  veranstaltungen: number;
  uebungsgruppen: number;
  termine: number;
  requests: number;
  progress: number;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  /** Nur im Detail-Endpoint gefüllt. */
  samples?: CrawlSampleDto[];
};

export type SemesterDto = {
  id: number;
  name: string;
  isSelectable: boolean;
  crawlUrl: string | null;
  modulCrawlUrl: string | null;
  veranstaltungenCount: number;
  modulCount: number;
};
```

- [ ] **Step 2: `crawl-jobs.ts` implementieren**

```ts
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createCrawlContext } from "@/lib/crawler/context";
import { crawlVeranstaltungen } from "@/lib/crawler/veranstaltungen";
import { crawlModule } from "@/lib/crawler/moduls";
import type { CrawlJobDto, CrawlJobTyp, CrawlSampleDto } from "@/types/crawl";

export const MAX_DELAY_MS = 60000;

export type StartJobInput = {
  typ: CrawlJobTyp;
  semesterId: number;
  delayBaseMs: number;
  delayJitterMs: number;
};

export type StartJobResult =
  | { ok: true; job: CrawlJobDto }
  | { ok: false; code: "BUSY" | "NO_URL" | "BAD_DELAY" | "NO_SEMESTER"; message: string };

const jobWithSemester = Prisma.validator<Prisma.CrawlJobDefaultArgs>()({
  include: { semester: { select: { name: true } } },
});
type JobWithSemester = Prisma.CrawlJobGetPayload<typeof jobWithSemester>;

function toDto(job: JobWithSemester, withSamples: boolean): CrawlJobDto {
  return {
    id: job.id,
    typ: job.typ,
    status: job.status,
    semesterId: job.semesterId,
    semesterName: job.semester.name,
    stopRequested: job.stopRequested,
    delayBaseMs: job.delayBaseMs,
    delayJitterMs: job.delayJitterMs,
    currentUrl: job.currentUrl,
    menus: job.menus,
    veranstaltungen: job.veranstaltungen,
    uebungsgruppen: job.uebungsgruppen,
    termine: job.termine,
    requests: job.requests,
    progress: job.progress,
    error: job.error,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    ...(withSamples ? { samples: (job.samples as unknown as CrawlSampleDto[]) ?? [] } : {}),
  };
}

let reconciled = false;

/**
 * Ein Job, der einen Server-Neustart nicht überlebt hat, stünde für immer auf
 * RUNNING und würde durch die Ein-Job-Sperre jeden weiteren Start blockieren.
 * Deshalb wird beim ersten Zugriff nach dem Start aufgeräumt.
 */
export async function reconcileOrphans(): Promise<void> {
  if (reconciled) {
    return;
  }
  reconciled = true;
  await prisma.crawlJob.updateMany({
    where: { status: { in: ["PENDING", "RUNNING"] } },
    data: {
      status: "ERROR",
      error: "Server wurde neu gestartet",
      completedAt: new Date(),
    },
  });
}

export async function listJobs(): Promise<{
  active: CrawlJobDto | null;
  history: CrawlJobDto[];
}> {
  await reconcileOrphans();

  const [active, history] = await Promise.all([
    prisma.crawlJob.findFirst({
      where: { status: { in: ["PENDING", "RUNNING"] } },
      ...jobWithSemester,
    }),
    prisma.crawlJob.findMany({
      where: { status: { in: ["COMPLETED", "STOPPED", "ERROR"] } },
      orderBy: { createdAt: "desc" },
      take: 25,
      ...jobWithSemester,
    }),
  ]);

  return {
    active: active ? toDto(active, false) : null,
    history: history.map((job) => toDto(job, false)),
  };
}

export async function getJob(id: string): Promise<CrawlJobDto | null> {
  const job = await prisma.crawlJob.findUnique({ where: { id }, ...jobWithSemester });
  return job ? toDto(job, true) : null;
}

export async function stopJob(id: string): Promise<boolean> {
  const updated = await prisma.crawlJob.updateMany({
    where: { id, status: { in: ["PENDING", "RUNNING"] } },
    data: { stopRequested: true },
  });
  return updated.count > 0;
}

export async function startJob(input: StartJobInput): Promise<StartJobResult> {
  await reconcileOrphans();

  const { typ, semesterId, delayBaseMs, delayJitterMs } = input;

  if (
    !Number.isInteger(delayBaseMs) ||
    !Number.isInteger(delayJitterMs) ||
    delayBaseMs < 0 ||
    delayJitterMs < 0 ||
    delayBaseMs > MAX_DELAY_MS ||
    delayJitterMs > MAX_DELAY_MS
  ) {
    return {
      ok: false,
      code: "BAD_DELAY",
      message: `Verzögerungen müssen ganze Zahlen zwischen 0 und ${MAX_DELAY_MS} ms sein.`,
    };
  }

  const semester = await prisma.semester.findUnique({ where: { id: semesterId } });
  if (!semester) {
    return { ok: false, code: "NO_SEMESTER", message: "Semester nicht gefunden." };
  }

  const url = typ === "VERANSTALTUNGEN" ? semester.crawlUrl : semester.modulCrawlUrl;
  if (!url) {
    return {
      ok: false,
      code: "NO_URL",
      message:
        typ === "VERANSTALTUNGEN"
          ? `Für "${semester.name}" ist keine Veranstaltungs-URL hinterlegt.`
          : `Für "${semester.name}" ist keine Modul-URL hinterlegt.`,
    };
  }

  let job: JobWithSemester;
  try {
    job = await prisma.crawlJob.create({
      data: { typ, semesterId, delayBaseMs, delayJitterMs, status: "PENDING" },
      ...jobWithSemester,
    });
  } catch (error) {
    // P2002 = Unique-Verletzung, hier der partielle Index auf aktive Jobs.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, code: "BUSY", message: "Es läuft bereits ein Crawl-Job." };
    }
    throw error;
  }

  void runJob(job.id, typ, url, semesterId, delayBaseMs, delayJitterMs);

  return { ok: true, job: toDto(job, false) };
}

/** Läuft im Hintergrund weiter, nachdem die Route längst geantwortet hat. */
async function runJob(
  jobId: string,
  typ: CrawlJobTyp,
  url: string,
  semesterId: number,
  delayBaseMs: number,
  delayJitterMs: number,
): Promise<void> {
  const ctx = createCrawlContext(jobId, delayBaseMs, delayJitterMs);

  try {
    await prisma.crawlJob.update({
      where: { id: jobId },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    console.log(`Starting crawl job ${jobId} (${typ}) for semester ${semesterId}`);

    if (typ === "VERANSTALTUNGEN") {
      await crawlVeranstaltungen(ctx, url, semesterId);
    } else {
      await crawlModule(ctx, url, semesterId);
    }

    const stopped = await prisma.crawlJob
      .findUnique({ where: { id: jobId }, select: { stopRequested: true } })
      .then((j) => j?.stopRequested ?? false);

    await prisma.crawlJob.update({
      where: { id: jobId },
      data: { status: stopped ? "STOPPED" : "COMPLETED", completedAt: new Date() },
    });
  } catch (error) {
    console.error(`Crawl job ${jobId} fehlgeschlagen:`, error);
    await prisma.crawlJob
      .update({
        where: { id: jobId },
        data: {
          status: "ERROR",
          error: error instanceof Error ? error.message : "Unbekannter Fehler",
          completedAt: new Date(),
        },
      })
      .catch(() => {});
  }
}
```

- [ ] **Step 3: Typprüfung und Lint**

Run: `bunx tsc --noEmit && bun run lint`
Expected: keine Fehler

- [ ] **Step 4: Commit**

```bash
git add src/types/crawl.ts src/lib/crawl-jobs.ts
git commit -m "feat: Crawl-Job-Lebenszyklus mit DB-Persistenz und Ein-Job-Sperre"
```

---

### Task 7: Crawl-Job-API-Routes, alte Routes entfernen

**Files:**
- Create: `src/app/api/admin/crawl-jobs/route.ts`
- Create: `src/app/api/admin/crawl-jobs/[id]/route.ts`
- Create: `src/app/api/admin/crawl-jobs/[id]/stop/route.ts`
- Delete: `src/app/api/admin/crawl/route.ts`
- Delete: `src/app/api/admin/crawl-moduls/route.ts`

**Interfaces:**
- Consumes: `startJob`, `stopJob`, `listJobs`, `getJob` (Task 6)
- Produces: HTTP-Endpunkte wie in der Spec beschrieben

- [ ] **Step 1: Listen- und Start-Route anlegen**

`src/app/api/admin/crawl-jobs/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { listJobs, startJob } from "@/lib/crawl-jobs";
import type { CrawlJobTyp } from "@/types/crawl";

export async function GET() {
  return NextResponse.json(await listJobs());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const typ = body.typ as CrawlJobTyp;
  if (typ !== "VERANSTALTUNGEN" && typ !== "MODULE") {
    return NextResponse.json(
      { error: "typ muss VERANSTALTUNGEN oder MODULE sein." },
      { status: 400 },
    );
  }

  const semesterId = Number(body.semesterId);
  if (!Number.isInteger(semesterId)) {
    return NextResponse.json({ error: "semesterId fehlt oder ist ungültig." }, { status: 400 });
  }

  const result = await startJob({
    typ,
    semesterId,
    delayBaseMs: Number(body.delayBaseMs),
    delayJitterMs: Number(body.delayJitterMs),
  });

  if (result.ok) {
    return NextResponse.json(result.job, { status: 202 });
  }

  if (result.code === "BUSY") {
    const { active } = await listJobs();
    return NextResponse.json({ error: result.message, active }, { status: 409 });
  }

  const status = result.code === "NO_SEMESTER" ? 404 : 400;
  return NextResponse.json({ error: result.message }, { status });
}
```

- [ ] **Step 2: Detail-Route anlegen**

`src/app/api/admin/crawl-jobs/[id]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getJob } from "@/lib/crawl-jobs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    return NextResponse.json({ error: "Job nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json(job);
}
```

- [ ] **Step 3: Stopp-Route anlegen**

`src/app/api/admin/crawl-jobs/[id]/stop/route.ts`:

```ts
import { NextResponse } from "next/server";
import { stopJob } from "@/lib/crawl-jobs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stopped = await stopJob(id);

  if (!stopped) {
    return NextResponse.json({ error: "Kein aktiver Job mit dieser ID." }, { status: 404 });
  }

  return NextResponse.json({ message: "Stopp angefordert." });
}
```

- [ ] **Step 4: Alte Routes löschen**

```bash
git rm -r src/app/api/admin/crawl src/app/api/admin/crawl-moduls
```

- [ ] **Step 5: Manuell verifizieren**

Dev-Server starten (`bun run dev`), im Browser bei `/admin/login` anmelden, damit das `admin_session`-Cookie gesetzt ist. Dann in den DevTools-Konsole des Admin-Tabs:

```js
await (await fetch("/api/admin/crawl-jobs")).json();
```
Expected: `{ active: null, history: [] }`

```js
await (await fetch("/api/admin/crawl-jobs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ typ: "VERANSTALTUNGEN", semesterId: 1, delayBaseMs: 1000, delayJitterMs: 1000 }),
})).json();
```
Expected: `400` mit `"Für ... ist keine Veranstaltungs-URL hinterlegt."`, solange am Semester 1 noch keine URL steht. Das bestätigt Validierung und Semester-Lookup. (Ein echter Crawl wird erst in Task 12 durchgeführt, wenn die URLs über das Panel pflegbar sind.)

- [ ] **Step 6: Typprüfung, Lint und Commit**

```bash
bunx tsc --noEmit && bun run lint
git add src/app/api/admin/crawl-jobs
git commit -m "feat: einheitliche Crawl-Job-API, alte Crawl-Routes entfernt"
```

---

### Task 8: Semester-API und Reset-Umbau

**Files:**
- Create: `src/app/api/admin/semesters/route.ts`
- Create: `src/app/api/admin/semesters/[id]/route.ts`
- Modify: `src/app/api/admin/reset/route.ts`

**Interfaces:**
- Consumes: `SemesterDto` (Task 6)
- Produces: CRUD-Endpunkte für Semester, semesterbezogener Reset

- [ ] **Step 1: Listen- und Anlege-Route**

`src/app/api/admin/semesters/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SemesterDto } from "@/types/crawl";

export async function GET() {
  const semesters = await prisma.semester.findMany({
    orderBy: { id: "asc" },
    include: { _count: { select: { veranstaltungen: true, module: true } } },
  });

  const dto: SemesterDto[] = semesters.map((s) => ({
    id: s.id,
    name: s.name,
    isSelectable: s.isSelectable,
    crawlUrl: s.crawlUrl,
    modulCrawlUrl: s.modulCrawlUrl,
    veranstaltungenCount: s._count.veranstaltungen,
    modulCount: s._count.module,
  }));

  return NextResponse.json(dto);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name ist erforderlich." }, { status: 400 });
  }

  try {
    const created = await prisma.semester.create({
      data: {
        name,
        crawlUrl: emptyToNull(body?.crawlUrl),
        modulCrawlUrl: emptyToNull(body?.modulCrawlUrl),
        isSelectable: body?.isSelectable !== false,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Dieses Semester existiert bereits." }, { status: 409 });
    }
    throw error;
  }
}

function emptyToNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}
```

- [ ] **Step 2: Änderungs- und Lösch-Route**

`src/app/api/admin/semesters/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const semesterId = Number(id);
  if (!Number.isInteger(semesterId)) {
    return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const data: Prisma.SemesterUpdateInput = {};

  if (typeof body?.name === "string" && body.name.trim() !== "") {
    data.name = body.name.trim();
  }
  if ("crawlUrl" in (body ?? {})) {
    data.crawlUrl = emptyToNull(body.crawlUrl);
  }
  if ("modulCrawlUrl" in (body ?? {})) {
    data.modulCrawlUrl = emptyToNull(body.modulCrawlUrl);
  }
  if (typeof body?.isSelectable === "boolean") {
    data.isSelectable = body.isSelectable;
  }

  try {
    const updated = await prisma.semester.update({ where: { id: semesterId }, data });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "Dieses Semester existiert bereits." }, { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Semester nicht gefunden." }, { status: 404 });
      }
    }
    throw error;
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const semesterId = Number(id);
  if (!Number.isInteger(semesterId)) {
    return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
  }

  const counts = await prisma.semester.findUnique({
    where: { id: semesterId },
    include: { _count: { select: { veranstaltungen: true, module: true, crawlJobs: true } } },
  });

  if (!counts) {
    return NextResponse.json({ error: "Semester nicht gefunden." }, { status: 404 });
  }

  if (counts._count.veranstaltungen > 0 || counts._count.module > 0) {
    return NextResponse.json(
      { error: "Semester enthält noch Daten. Bitte zuerst die Daten löschen." },
      { status: 409 },
    );
  }

  await prisma.$transaction([
    prisma.crawlJob.deleteMany({ where: { semesterId } }),
    prisma.semester.delete({ where: { id: semesterId } }),
  ]);

  return NextResponse.json({ message: "Semester gelöscht." });
}

function emptyToNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}
```

- [ ] **Step 3: Reset-Route umbauen**

`src/app/api/admin/reset/route.ts` vollständig ersetzen:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Löscht alle Kursdaten eines Semesters; das Semester samt URLs bleibt bestehen. */
async function deleteSemesterData(semesterId: number) {
  return prisma.$transaction([
    prisma.termin.deleteMany({
      where: {
        OR: [
          { veranstaltung: { semesterId } },
          { uebung: { veranstaltung: { semesterId } } },
        ],
      },
    }),
    prisma.uebungsgruppe.deleteMany({ where: { veranstaltung: { semesterId } } }),
    prisma.veranstaltungInModul.deleteMany({
      where: {
        OR: [{ veranstaltung: { semesterId } }, { modul: { semesterId } }],
      },
    }),
    prisma.modul.deleteMany({ where: { semesterId } }),
    prisma.veranstaltung.deleteMany({ where: { semesterId } }),
  ]);
}

/** Nur außerhalb der Produktion: löscht sämtliche Kursdaten aller Semester. */
async function deleteEverything() {
  return prisma.$transaction([
    prisma.termin.deleteMany({}),
    prisma.uebungsgruppe.deleteMany({}),
    prisma.veranstaltungInModul.deleteMany({}),
    prisma.modul.deleteMany({}),
    prisma.veranstaltung.deleteMany({}),
  ]);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (body?.semesterId !== undefined) {
    const semesterId = Number(body.semesterId);
    if (!Number.isInteger(semesterId)) {
      return NextResponse.json({ error: "Ungültige semesterId." }, { status: 400 });
    }

    const semester = await prisma.semester.findUnique({ where: { id: semesterId } });
    if (!semester) {
      return NextResponse.json({ error: "Semester nicht gefunden." }, { status: 404 });
    }

    const deleted = await deleteSemesterData(semesterId);
    return NextResponse.json({
      message: `Daten von "${semester.name}" gelöscht.`,
      deleted: deleted.map((d) => d.count),
    });
  }

  // Der globale Rundumschlag wurde bisher nur im Frontend versteckt — die Route
  // selbst war offen. Jetzt serverseitig gesperrt.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Der vollständige Reset ist in der Produktion gesperrt." },
      { status: 403 },
    );
  }

  const deleted = await deleteEverything();
  return NextResponse.json({
    message: "Alle Kursdaten gelöscht.",
    deleted: deleted.map((d) => d.count),
  });
}
```

- [ ] **Step 4: Manuell verifizieren**

Dev-Server läuft, im Admin-Tab in der Konsole:

```js
await (await fetch("/api/admin/semesters")).json();
```
Expected: Array aller Semester mit `crawlUrl: null`, `modulCrawlUrl: null` und den Zählern.

```js
await (await fetch("/api/admin/semesters", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "__probe__", isSelectable: false }),
})).json();
```
Expected: `201` mit dem neuen Semester. Ein zweiter identischer Aufruf: `409`.

Danach das Probe-Semester über `DELETE /api/admin/semesters/<id>` entfernen — Expected: `{ message: "Semester gelöscht." }`.

- [ ] **Step 5: Typprüfung, Lint und Commit**

```bash
bunx tsc --noEmit && bun run lint
git add src/app/api/admin/semesters src/app/api/admin/reset
git commit -m "feat: Semester-Verwaltung per API, Reset semesterbezogen und serverseitig abgesichert"
```

---

### Task 9: Metriken — Raten und Restzeitschätzung

Reine Funktionen, die das Panel füttern. Vollständig testbar, deshalb wieder TDD.

**Files:**
- Create: `src/lib/crawl-metrics.ts`
- Create: `tests/crawl-metrics.test.ts`

**Interfaces:**
- Consumes: `CrawlSampleDto` (Task 6)
- Produces:
  - `ratesPerMinute(samples: CrawlSampleDto[]): RatePoint[]` mit `type RatePoint = { t: number; veranstaltungen: number; requests: number }`
  - `estimateEtaMs(input: EtaInput): number | null`
  - `formatDuration(ms: number): string`
  - `formatEta(ms: number | null): string`

- [ ] **Step 1: Tests schreiben**

`tests/crawl-metrics.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import {
  estimateEtaMs,
  formatDuration,
  formatEta,
  ratesPerMinute,
} from "@/lib/crawl-metrics";

const MIN = 60000;

describe("ratesPerMinute", () => {
  test("bildet Differenzen zwischen aufeinanderfolgenden Samples", () => {
    const rates = ratesPerMinute([
      { t: 0, r: 0, v: 0, d: 0, p: 0 },
      { t: MIN, r: 40, v: 10, d: 30, p: 0.1 },
      { t: 2 * MIN, r: 100, v: 25, d: 80, p: 0.2 },
    ]);

    expect(rates).toEqual([
      { t: MIN, veranstaltungen: 10, requests: 40 },
      { t: 2 * MIN, veranstaltungen: 15, requests: 60 },
    ]);
  });

  test("skaliert auf eine Minute hoch, wenn der Abstand kleiner ist", () => {
    const rates = ratesPerMinute([
      { t: 0, r: 0, v: 0, d: 0, p: 0 },
      { t: MIN / 2, r: 10, v: 5, d: 0, p: 0.01 },
    ]);

    expect(rates).toEqual([{ t: MIN / 2, veranstaltungen: 10, requests: 20 }]);
  });

  test("liefert nichts bei weniger als zwei Samples", () => {
    expect(ratesPerMinute([])).toEqual([]);
    expect(ratesPerMinute([{ t: 0, r: 0, v: 0, d: 0, p: 0 }])).toEqual([]);
  });

  test("überspringt Samples mit identischem Zeitstempel", () => {
    const rates = ratesPerMinute([
      { t: MIN, r: 10, v: 5, d: 0, p: 0.1 },
      { t: MIN, r: 20, v: 9, d: 0, p: 0.1 },
    ]);
    expect(rates).toEqual([]);
  });
});

describe("estimateEtaMs", () => {
  test("extrapoliert aus dem Fortschritt, wenn er tragfähig ist", () => {
    const eta = estimateEtaMs({
      elapsedMs: 10 * MIN,
      progress: 0.5,
      requests: 500,
      samples: [],
      expectedRequests: null,
    });
    expect(eta).toBeCloseTo(10 * MIN, -2);
  });

  test("nutzt in der Anfangsphase die Request-Prognose des Vorlaufs", () => {
    // 100 Requests in 10 Minuten = 6 s pro Request, 900 fehlen noch
    const eta = estimateEtaMs({
      elapsedMs: 10 * MIN,
      progress: 0.005,
      requests: 100,
      samples: [],
      expectedRequests: 1000,
    });
    expect(eta).toBeCloseTo(900 * 6000, -2);
  });

  test("liefert null in der Anfangsphase ohne Vorlaufdaten", () => {
    expect(
      estimateEtaMs({
        elapsedMs: MIN,
        progress: 0.005,
        requests: 10,
        samples: [],
        expectedRequests: null,
      }),
    ).toBeNull();
  });

  test("blendet zwischen Prognose und Baumschätzung über", () => {
    const blended = estimateEtaMs({
      elapsedMs: 10 * MIN,
      progress: 0.035, // Mitte zwischen 0,02 und 0,05 -> Gewicht 0,5
      requests: 100,
      samples: [],
      expectedRequests: 1000,
    });

    const prior = 900 * 6000;
    const tree = 10 * MIN * (1 - 0.035) / 0.035;
    expect(blended).toBeCloseTo(prior * 0.5 + tree * 0.5, -2);
  });

  test("verwirft die Prognose, wenn der Lauf sie bereits überholt hat", () => {
    const eta = estimateEtaMs({
      elapsedMs: 10 * MIN,
      progress: 0.005,
      requests: 2000,
      samples: [],
      expectedRequests: 1000,
    });
    expect(eta).toBeCloseTo(10 * MIN * (1 - 0.005) / 0.005, -2);
  });

  test("glättet über die letzten Samples", () => {
    // Zwei ältere Samples sahen jeweils 20 Minuten Gesamtlaufzeit voraus,
    // der aktuelle Punkt ebenfalls -> Ergebnis bleibt bei 10 Minuten Rest.
    const eta = estimateEtaMs({
      elapsedMs: 10 * MIN,
      progress: 0.5,
      requests: 500,
      samples: [
        { t: 4 * MIN, r: 200, v: 40, d: 100, p: 0.2 },
        { t: 6 * MIN, r: 300, v: 60, d: 160, p: 0.3 },
      ],
      expectedRequests: null,
    });
    expect(eta).toBeCloseTo(10 * MIN, -3);
  });

  test("liefert null ohne Fortschritt und ohne Prognose", () => {
    expect(
      estimateEtaMs({
        elapsedMs: MIN,
        progress: 0,
        requests: 0,
        samples: [],
        expectedRequests: null,
      }),
    ).toBeNull();
  });
});

describe("formatDuration", () => {
  test("formatiert Sekunden, Minuten und Stunden", () => {
    expect(formatDuration(45000)).toBe("45 s");
    expect(formatDuration(5 * MIN)).toBe("5 min");
    expect(formatDuration(95 * MIN)).toBe("1 h 35 min");
    expect(formatDuration(120 * MIN)).toBe("2 h");
  });
});

describe("formatEta", () => {
  test("rundet grob und benennt Unbekanntes", () => {
    expect(formatEta(null)).toBe("wird ermittelt");
    expect(formatEta(30000)).toBe("unter 1 Minute");
    expect(formatEta(8 * MIN)).toBe("noch ca. 10 min");
    expect(formatEta(134 * MIN)).toBe("noch ca. 2 h 15 min");
  });
});
```

- [ ] **Step 2: Tests laufen lassen, Fehlschlag bestätigen**

Run: `bun test tests/crawl-metrics.test.ts`
Expected: FAIL — `Cannot find module '@/lib/crawl-metrics'`

- [ ] **Step 3: `crawl-metrics.ts` implementieren**

```ts
import type { CrawlSampleDto } from "@/types/crawl";

const MINUTE_MS = 60000;

/** Ab hier gilt der Fortschrittsbruch als tragfähig genug zum Extrapolieren. */
const TREE_TRUST_FLOOR = 0.02;
/** Ab hier wird ausschließlich extrapoliert. */
const TREE_TRUST_CEILING = 0.05;
/** Über so viele Samples wird die Baumschätzung geglättet. */
const SMOOTHING_WINDOW = 5;

export type RatePoint = {
  /** Millisekunden seit Jobstart. */
  t: number;
  veranstaltungen: number;
  requests: number;
};

/**
 * Die Samples enthalten kumulative Zähler. Für die Diagramme brauchen wir
 * Raten, also die Differenz zum Vorgänger, hochgerechnet auf eine Minute.
 */
export function ratesPerMinute(samples: CrawlSampleDto[]): RatePoint[] {
  const points: RatePoint[] = [];

  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1];
    const cur = samples[i];
    const dt = cur.t - prev.t;
    if (dt <= 0) {
      continue;
    }
    const factor = MINUTE_MS / dt;
    points.push({
      t: cur.t,
      veranstaltungen: Math.round((cur.v - prev.v) * factor),
      requests: Math.round((cur.r - prev.r) * factor),
    });
  }

  return points;
}

export type EtaInput = {
  elapsedMs: number;
  progress: number;
  requests: number;
  samples: CrawlSampleDto[];
  /** Requests des letzten abgeschlossenen Laufs desselben Typs. */
  expectedRequests: number | null;
};

/**
 * Restzeit in Millisekunden, oder null solange keine belastbare Schätzung
 * möglich ist.
 *
 * Primär wird aus der Baumposition extrapoliert: bei halbem Fortschritt nach
 * zehn Minuten bleiben zehn Minuten. Solange der Fortschritt aber noch winzig
 * ist, schwankt diese Rechnung stark — dort greift stattdessen die Anzahl
 * Requests des letzten vollständigen Laufs. Dazwischen wird übergeblendet.
 */
export function estimateEtaMs(input: EtaInput): number | null {
  const { elapsedMs, progress, requests, samples, expectedRequests } = input;

  const tree = progress > 0 ? smoothedTreeEta(samples, elapsedMs, progress) : null;

  const priorExists = expectedRequests !== null && requests > 0 && elapsedMs > 0;
  const priorOvertaken = priorExists && expectedRequests <= requests;
  const prior =
    priorExists && !priorOvertaken
      ? (expectedRequests - requests) * (elapsedMs / requests)
      : null;

  if (progress < TREE_TRUST_FLOOR) {
    if (prior !== null) {
      return prior;
    }
    // Der Lauf ist bereits über die Prognose hinaus — dann ist die Prognose
    // wertlos und die Baumschätzung trotz kleinem Fortschritt das Bessere.
    // Ohne jede Vorlaufdaten bleibt in dieser Phase nur „unbekannt".
    return priorOvertaken ? tree : null;
  }

  if (tree === null) {
    return prior;
  }

  if (progress >= TREE_TRUST_CEILING || prior === null) {
    return tree;
  }

  const weight = (progress - TREE_TRUST_FLOOR) / (TREE_TRUST_CEILING - TREE_TRUST_FLOOR);
  return prior * (1 - weight) + tree * weight;
}

/**
 * Jeder Messpunkt liefert eine eigene Schätzung der Gesamtdauer. Auf "ab jetzt"
 * umgerechnet und gemittelt ergibt das eine Zahl, die nicht bei jedem Poll
 * springt.
 */
function smoothedTreeEta(
  samples: CrawlSampleDto[],
  elapsedMs: number,
  progress: number,
): number {
  const estimates: number[] = [(elapsedMs * (1 - progress)) / progress];

  const window = samples.filter((s) => s.p > 0 && s.t > 0).slice(-SMOOTHING_WINDOW);
  for (const sample of window) {
    const totalFromSample = sample.t / sample.p;
    const remaining = totalFromSample - elapsedMs;
    if (remaining > 0) {
      estimates.push(remaining);
    }
  }

  return estimates.reduce((sum, value) => sum + value, 0) / estimates.length;
}

/** Kompakte Dauer für KPI-Kacheln und die Historie. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));

  if (totalSeconds < 60) {
    return `${totalSeconds} s`;
  }

  const totalMinutes = Math.round(totalSeconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

/**
 * Bewusst grob gerundet — die Schätzung ist nicht genauer als fünf Minuten,
 * und eine sekundengenaue Anzeige würde das Gegenteil suggerieren.
 */
export function formatEta(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms < 0) {
    return "wird ermittelt";
  }

  if (ms < MINUTE_MS) {
    return "unter 1 Minute";
  }

  const roundedMinutes = Math.max(5, Math.round(ms / (5 * MINUTE_MS)) * 5);
  return `noch ca. ${formatDuration(roundedMinutes * MINUTE_MS)}`;
}
```

- [ ] **Step 4: Tests laufen lassen, Erfolg bestätigen**

Run: `bun test`
Expected: PASS, alle Testdateien

- [ ] **Step 5: Lint und Commit**

```bash
bun run lint
git add src/lib/crawl-metrics.ts tests/crawl-metrics.test.ts
git commit -m "feat: Durchsatzraten und Restzeitschätzung für Crawl-Jobs"
```

---

### Task 10: Chart-Komponente und Polling-Hook

**Files:**
- Create: `src/components/ui/chart.tsx`
- Create: `src/hooks/use-crawl-jobs.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `CrawlJobDto`, `SemesterDto` (Task 6), Crawl-API (Tasks 7, 8)
- Produces:
  - `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `type ChartConfig` aus `@/components/ui/chart`
  - `useCrawlJobs(): { active, history, semesters, loading, refresh, startJob, stopJob }`

- [ ] **Step 1: recharts installieren**

```bash
bun add recharts
```

- [ ] **Step 2: shadcn-Chart-Wrapper anlegen**

```bash
bunx --bun shadcn@latest add chart
```

Die CLI legt `src/components/ui/chart.tsx` an und nutzt die bereits vorhandenen `--chart-1` bis `--chart-5` aus `src/app/globals.css:128-132`. Fragt sie nach Überschreiben bestehender Dateien, ausschließlich `chart.tsx` bestätigen — `card.tsx`, `button.tsx` und die übrigen Komponenten bleiben unangetastet.

Danach prüfen, dass die Datei existiert und `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` sowie `ChartConfig` exportiert:

```bash
grep -n "^export" src/components/ui/chart.tsx
```

Schlägt die CLI fehl (etwa weil keine `components.json` existiert), die Komponente stattdessen von Hand aus der shadcn-Dokumentation übernehmen — sie hat außer `recharts` und `@/lib/utils` keine Abhängigkeiten.

- [ ] **Step 3: Polling-Hook implementieren**

`src/hooks/use-crawl-jobs.ts`:

```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { CrawlJobDto, CrawlJobTyp, SemesterDto } from "@/types/crawl";

const POLL_ACTIVE_MS = 2000;
const POLL_IDLE_MS = 15000;

export type StartJobArgs = {
  typ: CrawlJobTyp;
  semesterId: number;
  delayBaseMs: number;
  delayJitterMs: number;
};

export function useCrawlJobs() {
  const [active, setActive] = useState<CrawlJobDto | null>(null);
  const [history, setHistory] = useState<CrawlJobDto[]>([]);
  const [semesters, setSemesters] = useState<SemesterDto[]>([]);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSemesters = useCallback(async () => {
    const response = await fetch("/api/admin/semesters");
    if (response.ok) {
      setSemesters(await response.json());
    }
  }, []);

  const loadJobs = useCallback(async () => {
    const response = await fetch("/api/admin/crawl-jobs");
    if (!response.ok) {
      return null;
    }
    const data: { active: CrawlJobDto | null; history: CrawlJobDto[] } = await response.json();
    setActive(data.active);
    setHistory(data.history);
    return data.active;
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadJobs(), loadSemesters()]);
  }, [loadJobs, loadSemesters]);

  // Solange ein Job läuft, häufiger nachfragen. Der Timer wird nach jeder
  // Antwort neu gesetzt, damit sich langsame Antworten nicht stauen.
  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      const runningJob = await loadJobs();
      if (cancelled) {
        return;
      }
      setLoading(false);
      timer.current = setTimeout(tick, runningJob ? POLL_ACTIVE_MS : POLL_IDLE_MS);
    };

    void loadSemesters();
    void tick();

    return () => {
      cancelled = true;
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [loadJobs, loadSemesters]);

  const startJob = useCallback(
    async (args: StartJobArgs) => {
      const response = await fetch("/api/admin/crawl-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Job konnte nicht gestartet werden.");
        await refresh();
        return false;
      }

      toast.success("Crawl-Job gestartet.");
      await refresh();
      return true;
    },
    [refresh],
  );

  const stopJob = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/admin/crawl-jobs/${id}/stop`, { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error ?? "Stopp konnte nicht angefordert werden.");
        return;
      }
      toast.info("Stopp angefordert — der Crawler hält am nächsten Menüpunkt an.");
      await loadJobs();
    },
    [loadJobs],
  );

  return { active, history, semesters, loading, refresh, startJob, stopJob };
}
```

- [ ] **Step 4: Typprüfung, Lint und Commit**

```bash
bunx tsc --noEmit && bun run lint
git add package.json bun.lockb src/components/ui/chart.tsx src/hooks/use-crawl-jobs.ts
git commit -m "feat: Chart-Komponente und Polling-Hook für Crawl-Jobs"
```

---

### Task 11: Panel-Gerüst, Layout-Fix und Start-Sektion

**Files:**
- Create: `src/components/admin/start-crawl-card.tsx`
- Modify: `src/app/admin/panel/page.tsx`
- Modify: `src/app/admin/layout.tsx`

**Interfaces:**
- Consumes: `useCrawlJobs` (Task 10), `SemesterDto` (Task 6)
- Produces: `<StartCrawlCard semesters active onStart />`

- [ ] **Step 1: Verschachteltes `<html>`/`<body>` aus dem Admin-Layout entfernen**

`src/app/admin/layout.tsx` rendert derzeit ein eigenes `<html><body>` innerhalb des Root-Layouts, das bereits eines rendert. Das erzeugt ungültiges HTML und hängt den Admin-Bereich vom `<Toaster>` des Root-Layouts ab — ohne den erscheint kein einziger Toast.

In `src/app/admin/layout.tsx` das umschließende `<html lang="en"><body>` durch ein Fragment ersetzen. Aus:

```tsx
  return (
    <html lang="en">
      <body>
        <header
```

wird:

```tsx
  return (
    <>
      <header
```

und der Abschluss

```tsx
        {children}
      </body>
    </html>
  );
```

wird zu

```tsx
      {children}
    </>
  );
```

- [ ] **Step 2: Start-Sektion implementieren**

`src/components/admin/start-crawl-card.tsx`:

```tsx
"use client";

import { useState } from "react";
import { AlertTriangle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CrawlJobDto, CrawlJobTyp, SemesterDto } from "@/types/crawl";
import type { StartJobArgs } from "@/hooks/use-crawl-jobs";

type Props = {
  semesters: SemesterDto[];
  active: CrawlJobDto | null;
  onStart: (args: StartJobArgs) => Promise<boolean>;
};

export function StartCrawlCard({ semesters, active, onStart }: Props) {
  const [semesterId, setSemesterId] = useState<string>("");
  const [typ, setTyp] = useState<CrawlJobTyp>("VERANSTALTUNGEN");
  const [delayEnabled, setDelayEnabled] = useState(true);
  const [delayBase, setDelayBase] = useState("1000");
  const [delayJitter, setDelayJitter] = useState("1000");
  const [starting, setStarting] = useState(false);

  const semester = semesters.find((s) => String(s.id) === semesterId) ?? null;
  const urlForTyp = semester
    ? typ === "VERANSTALTUNGEN"
      ? semester.crawlUrl
      : semester.modulCrawlUrl
    : null;

  const blockedReason = active
    ? "Es läuft bereits ein Job. Warte, bis er fertig ist, oder stoppe ihn oben."
    : !semester
      ? "Bitte ein Semester auswählen."
      : !urlForTyp
        ? typ === "VERANSTALTUNGEN"
          ? `Für „${semester.name}" ist keine Veranstaltungs-URL hinterlegt — siehe Sektion „Semester verwalten".`
          : `Für „${semester.name}" ist keine Modul-URL hinterlegt — siehe Sektion „Semester verwalten".`
        : null;

  const handleStart = async () => {
    if (!semester) {
      return;
    }
    setStarting(true);
    await onStart({
      typ,
      semesterId: semester.id,
      delayBaseMs: delayEnabled ? Number(delayBase) : 0,
      delayJitterMs: delayEnabled ? Number(delayJitter) : 0,
    });
    setStarting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crawl starten</CardTitle>
        <CardDescription>
          Die STiNE-Einstiegspunkte hängen am Semester und werden unten verwaltet.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="semester">Semester</Label>
            <Select value={semesterId} onValueChange={setSemesterId}>
              <SelectTrigger id="semester">
                <SelectValue placeholder="Semester wählen" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                    {!s.crawlUrl && !s.modulCrawlUrl ? " — keine URLs" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Was soll gecrawlt werden?</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={typ === "VERANSTALTUNGEN" ? "default" : "outline"}
                onClick={() => setTyp("VERANSTALTUNGEN")}>
                Veranstaltungen
              </Button>
              <Button
                type="button"
                variant={typ === "MODULE" ? "default" : "outline"}
                onClick={() => setTyp("MODULE")}>
                Module
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={delayEnabled}
              onChange={(e) => setDelayEnabled(e.target.checked)}
              className="h-4 w-4"
            />
            Verzögerung zwischen Requests
          </label>

          {delayEnabled ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="delay-base">Basis (ms)</Label>
                <Input
                  id="delay-base"
                  type="number"
                  min={0}
                  max={60000}
                  value={delayBase}
                  onChange={(e) => setDelayBase(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="delay-jitter">Zufälliger Aufschlag bis (ms)</Label>
                <Input
                  id="delay-jitter"
                  type="number"
                  min={0}
                  max={60000}
                  value={delayJitter}
                  onChange={(e) => setDelayJitter(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <p className="flex items-start gap-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Ohne Verzögerung laufen die Requests ungebremst gegen die Uni-Server. Nur für
              kurze Testläufe verwenden.
            </p>
          )}
        </div>

        {blockedReason && <p className="text-sm text-muted-foreground">{blockedReason}</p>}

        <Button
          onClick={handleStart}
          disabled={blockedReason !== null || starting}
          className="self-start">
          <Play className="mr-2 h-4 w-4" />
          {starting ? "Wird gestartet…" : "Crawl starten"}
        </Button>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Panel-Seite auf das neue Gerüst umstellen**

`src/app/admin/panel/page.tsx` vollständig ersetzen. Die Sektionen 2 bis 5 kommen in den folgenden Tasks dazu; bis dahin bleibt es bei Start-Sektion und Ladezustand.

```tsx
"use client";

import { StartCrawlCard } from "@/components/admin/start-crawl-card";
import { useCrawlJobs } from "@/hooks/use-crawl-jobs";

export default function AdminPanel() {
  const { active, semesters, loading, startJob } = useCrawlJobs();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-white">Admin-Panel</h1>

      {loading ? (
        <p className="text-white/80">Wird geladen…</p>
      ) : (
        <StartCrawlCard semesters={semesters} active={active} onStart={startJob} />
      )}
    </main>
  );
}
```

- [ ] **Step 4: Manuell prüfen**

`bun run dev`, `/admin/panel` öffnen.

Expected:
- Die Seite rendert eine Karte „Crawl starten"; im Browser-Inspector gibt es genau ein `<html>` und ein `<body>`.
- Das Semester-Dropdown listet die vorhandenen Semester.
- Ohne Auswahl ist der Start-Button deaktiviert mit Hinweis „Bitte ein Semester auswählen."
- Nach Auswahl eines Semesters ohne URLs bleibt er deaktiviert mit dem passenden URL-Hinweis.
- Der Verzögerungs-Schalter blendet die beiden Zahlenfelder aus und den Warnhinweis ein.

- [ ] **Step 5: Typprüfung, Lint und Commit**

```bash
bunx tsc --noEmit && bun run lint
git add src/app/admin/layout.tsx src/app/admin/panel/page.tsx src/components/admin/start-crawl-card.tsx
git commit -m "feat: Panel-Gerüst mit Crawl-Start-Sektion, Layout-Verschachtelung behoben"
```

---

### Task 12: Sektion „Laufender Job" mit Fortschritt, KPIs und Durchsatz-Chart

**Files:**
- Create: `src/components/admin/active-job-card.tsx`
- Modify: `src/app/admin/panel/page.tsx`

**Interfaces:**
- Consumes: `estimateEtaMs`, `formatEta`, `formatDuration`, `ratesPerMinute` (Task 9), `ChartContainer` (Task 10)
- Produces: `<ActiveJobCard job history onStop />`

- [ ] **Step 1: Komponente implementieren**

`src/components/admin/active-job-card.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { estimateEtaMs, formatDuration, formatEta, ratesPerMinute } from "@/lib/crawl-metrics";
import type { CrawlJobDto } from "@/types/crawl";

const chartConfig = {
  veranstaltungen: { label: "Veranstaltungen/min", color: "hsl(var(--chart-1))" },
  requests: { label: "Requests/min", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

type Props = {
  job: CrawlJobDto;
  /** Für die Anfangs-Prognose: abgeschlossene Läufe desselben Typs. */
  history: CrawlJobDto[];
  onStop: (id: string) => Promise<void>;
};

export function ActiveJobCard({ job, history, onStop }: Props) {
  const detail = useJobDetail(job.id, job.requests);
  const samples = detail?.samples ?? [];

  const startedAt = job.startedAt ? new Date(job.startedAt).getTime() : null;
  const elapsedMs = useElapsed(startedAt);

  const expectedRequests =
    history.find((h) => h.typ === job.typ && h.status === "COMPLETED")?.requests ?? null;

  const etaMs = estimateEtaMs({
    elapsedMs,
    progress: job.progress,
    requests: job.requests,
    samples,
    expectedRequests,
  });

  const finishAt = etaMs !== null ? new Date(Date.now() + etaMs) : null;
  const rates = ratesPerMinute(samples).slice(-120);
  const secondsPerVeranstaltung =
    job.veranstaltungen > 0 ? elapsedMs / job.veranstaltungen / 1000 : null;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle>{job.semesterName}</CardTitle>
          <Badge variant="secondary">
            {job.typ === "VERANSTALTUNGEN" ? "Veranstaltungen" : "Module"}
          </Badge>
          <Badge variant={job.stopRequested ? "destructive" : "default"}>
            {job.stopRequested ? "Stopp angefordert" : "Läuft"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            seit {formatDuration(elapsedMs)}
          </span>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={job.stopRequested}>
              <Square className="mr-2 h-4 w-4" />
              Stoppen
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Crawl stoppen?</AlertDialogTitle>
              <AlertDialogDescription>
                Der Crawler hält am nächsten Menüpunkt an. Bereits gespeicherte Daten bleiben
                erhalten; ein späterer Lauf ergänzt den Rest.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={() => onStop(job.id)}>Stoppen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="font-medium">{(job.progress * 100).toFixed(1)} %</span>
            <span className="text-muted-foreground">
              {formatEta(etaMs)}
              {finishAt &&
                ` · voraussichtlich fertig um ${finishAt.toLocaleTimeString("de-DE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${Math.min(100, job.progress * 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Laufzeit" value={formatDuration(elapsedMs)} />
          <Kpi
            label="Ø pro Veranstaltung"
            value={secondsPerVeranstaltung ? `${secondsPerVeranstaltung.toFixed(1)} s` : "—"}
          />
          <Kpi label="Requests" value={String(job.requests)} />
          <Kpi label="Menüs" value={String(job.menus)} />
          <Kpi label="Veranstaltungen" value={String(job.veranstaltungen)} />
          <Kpi label="Übungsgruppen" value={String(job.uebungsgruppen)} />
          <Kpi label="Termine" value={String(job.termine)} />
          <Kpi
            label="Verzögerung"
            value={
              job.delayBaseMs === 0 && job.delayJitterMs === 0
                ? "aus"
                : `${job.delayBaseMs} + 0–${job.delayJitterMs} ms`
            }
          />
        </div>

        {rates.length > 1 ? (
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <AreaChart data={rates}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="t"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => formatDuration(value)}
              />
              <YAxis tickLine={false} axisLine={false} width={40} />
              <ChartTooltip
                content={
                  <ChartTooltipContent labelFormatter={(value) => formatDuration(Number(value))} />
                }
              />
              <Area
                dataKey="requests"
                type="monotone"
                stroke="var(--color-requests)"
                fill="var(--color-requests)"
                fillOpacity={0.2}
              />
              <Area
                dataKey="veranstaltungen"
                type="monotone"
                stroke="var(--color-veranstaltungen)"
                fill="var(--color-veranstaltungen)"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <p className="text-sm text-muted-foreground">
            Der erste Messpunkt entsteht nach 30 Sekunden Laufzeit.
          </p>
        )}

        {job.currentUrl && (
          <p className="truncate text-xs text-muted-foreground" title={job.currentUrl}>
            Aktuell: {job.currentUrl}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

/**
 * Die Listen-API liefert bewusst keine Samples. Für das Diagramm werden sie
 * nachgeladen, aber nur wenn sich die Request-Zahl bewegt hat — sonst würde
 * jedes 2-Sekunden-Poll eine zweite Anfrage auslösen.
 */
function useJobDetail(jobId: string, requests: number) {
  const [detail, setDetail] = useState<CrawlJobDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/crawl-jobs/${jobId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Alle 30 gezählten Requests neu laden — grob der Sample-Takt.
  }, [jobId, Math.floor(requests / 30)]);

  return detail;
}

/** Laufzeit sekundengenau, ohne dafür die API zu befragen. */
function useElapsed(startedAt: number | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return startedAt ? Math.max(0, now - startedAt) : 0;
}
```

- [ ] **Step 2: Sektion in die Panel-Seite einhängen**

In `src/app/admin/panel/page.tsx` den Import ergänzen und die Karte über der Start-Sektion rendern:

```tsx
import { ActiveJobCard } from "@/components/admin/active-job-card";
```

und im JSX, direkt nach dem `<h1>`:

```tsx
      {active && <ActiveJobCard job={active} history={history} onStop={stopJob} />}
```

Dazu `history` und `stopJob` aus dem Hook destrukturieren:

```tsx
  const { active, history, semesters, loading, startJob, stopJob } = useCrawlJobs();
```

- [ ] **Step 3: Ersten echten Crawl fahren und beobachten**

Voraussetzung: mindestens ein Semester mit gültiger `crawlUrl`. Solange die Semester-Sektion aus Task 13 fehlt, die URL einmalig direkt setzen — die drei bisher hartcodierten URLs stehen in der Git-Historie in `src/app/api/admin/crawl/route.ts:29-35`:

```bash
bunx prisma studio
```

Semester öffnen, `crawlUrl` eintragen, speichern.

Dann im Panel den Job starten und prüfen:
- Die Karte „Laufender Job" erscheint innerhalb von zwei Sekunden.
- Requests, Menüs und Veranstaltungen zählen sichtbar hoch.
- Der Fortschrittsbalken bewegt sich, sobald das erste Untermenü fertig ist.
- Nach 30–60 Sekunden erscheint das Durchsatz-Diagramm.
- Der Stopp-Button setzt den Badge sofort auf „Stopp angefordert"; der Job wechselt kurz darauf in die Historie mit Status `STOPPED`.

Danach den Testlauf aufräumen, falls er unerwünschte Daten angelegt hat — dafür `POST /api/admin/reset` mit `{ "semesterId": <id> }` in der Browserkonsole.

- [ ] **Step 4: Typprüfung, Lint und Commit**

```bash
bunx tsc --noEmit && bun run lint
git add src/components/admin/active-job-card.tsx src/app/admin/panel/page.tsx
git commit -m "feat: Live-Ansicht des laufenden Crawl-Jobs mit Fortschritt und Durchsatz"
```

---

### Task 13: Sektion „Job-Historie" mit Semester-Vergleich

**Files:**
- Create: `src/components/admin/job-history-card.tsx`
- Modify: `src/app/admin/panel/page.tsx`

**Interfaces:**
- Consumes: `CrawlJobDto`, `SemesterDto`, `formatDuration`, `ratesPerMinute`, `ChartContainer`
- Produces: `<JobHistoryCard history semesters />`

- [ ] **Step 1: Komponente implementieren**

`src/components/admin/job-history-card.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { formatDuration, ratesPerMinute } from "@/lib/crawl-metrics";
import type { CrawlJobDto, CrawlJobStatus, SemesterDto } from "@/types/crawl";

const throughputConfig = {
  veranstaltungen: { label: "Veranstaltungen/min", color: "hsl(var(--chart-1))" },
  requests: { label: "Requests/min", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const semesterConfig = {
  veranstaltungen: { label: "Veranstaltungen", color: "hsl(var(--chart-1))" },
  module: { label: "Module", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const statusLabel: Record<CrawlJobStatus, string> = {
  PENDING: "Wartet",
  RUNNING: "Läuft",
  COMPLETED: "Fertig",
  STOPPED: "Gestoppt",
  ERROR: "Fehler",
};

const statusVariant: Record<CrawlJobStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  RUNNING: "default",
  COMPLETED: "secondary",
  STOPPED: "outline",
  ERROR: "destructive",
};

export function JobHistoryCard({
  history,
  semesters,
}: {
  history: CrawlJobDto[];
  semesters: SemesterDto[];
}) {
  const semesterData = semesters.map((s) => ({
    name: s.name,
    veranstaltungen: s.veranstaltungenCount,
    module: s.modulCount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job-Historie</CardTitle>
        <CardDescription>Die letzten 25 Läufe.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine abgeschlossenen Läufe.</p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {history.map((job) => (
              <AccordionItem key={job.id} value={job.id}>
                <AccordionTrigger>
                  <div className="flex flex-1 flex-wrap items-center gap-3 pr-3 text-left">
                    <Badge variant={statusVariant[job.status]}>{statusLabel[job.status]}</Badge>
                    <span className="font-medium">{job.semesterName}</span>
                    <span className="text-sm text-muted-foreground">
                      {job.typ === "VERANSTALTUNGEN" ? "Veranstaltungen" : "Module"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(job.createdAt).toLocaleString("de-DE")}
                    </span>
                    <span className="ml-auto text-sm text-muted-foreground">
                      {duration(job)} · {job.veranstaltungen} V · {job.termine} T
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <JobDetail job={job} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Datenbestand je Semester</h3>
          {semesterData.length > 0 ? (
            <ChartContainer config={semesterConfig} className="h-56 w-full">
              <BarChart data={semesterData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={50} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="veranstaltungen" fill="var(--color-veranstaltungen)" radius={4} />
                <Bar dataKey="module" fill="var(--color-module)" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground">Noch keine Semester angelegt.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function JobDetail({ job }: { job: CrawlJobDto }) {
  const [detail, setDetail] = useState<CrawlJobDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/crawl-jobs/${job.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [job.id]);

  const rates = ratesPerMinute(detail?.samples ?? []);

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
        <Detail label="Menüs" value={String(job.menus)} />
        <Detail label="Veranstaltungen" value={String(job.veranstaltungen)} />
        <Detail label="Übungsgruppen" value={String(job.uebungsgruppen)} />
        <Detail label="Termine" value={String(job.termine)} />
        <Detail label="Requests" value={String(job.requests)} />
        <Detail label="Fortschritt" value={`${(job.progress * 100).toFixed(1)} %`} />
        <Detail
          label="Verzögerung"
          value={
            job.delayBaseMs === 0 && job.delayJitterMs === 0
              ? "aus"
              : `${job.delayBaseMs} + 0–${job.delayJitterMs} ms`
          }
        />
        <Detail label="Dauer" value={duration(job)} />
      </dl>

      {job.error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{job.error}</p>
      )}

      {rates.length > 1 && (
        <ChartContainer config={throughputConfig} className="h-48 w-full">
          <AreaChart data={rates}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="t"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => formatDuration(value)}
            />
            <YAxis tickLine={false} axisLine={false} width={40} />
            <ChartTooltip
              content={
                <ChartTooltipContent labelFormatter={(value) => formatDuration(Number(value))} />
              }
            />
            <Area
              dataKey="requests"
              type="monotone"
              stroke="var(--color-requests)"
              fill="var(--color-requests)"
              fillOpacity={0.2}
            />
            <Area
              dataKey="veranstaltungen"
              type="monotone"
              stroke="var(--color-veranstaltungen)"
              fill="var(--color-veranstaltungen)"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function duration(job: CrawlJobDto): string {
  if (!job.startedAt || !job.completedAt) {
    return "—";
  }
  return formatDuration(
    new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime(),
  );
}
```

- [ ] **Step 2: In die Panel-Seite einhängen**

Import ergänzen und unter der Start-Sektion rendern:

```tsx
import { JobHistoryCard } from "@/components/admin/job-history-card";
```

```tsx
      <JobHistoryCard history={history} semesters={semesters} />
```

- [ ] **Step 3: Manuell prüfen**

`/admin/panel` öffnen. Expected:
- Die in Task 12 erzeugten Läufe erscheinen mit Status-Badge, Dauer und Zählern.
- Aufklappen lädt Details nach; bei einem Lauf über 30 Sekunden erscheint das Durchsatz-Diagramm.
- Bei einem fehlgeschlagenen Lauf steht die Fehlermeldung im rot hinterlegten Kasten.
- Das Balkendiagramm zeigt je Semester Veranstaltungs- und Modulzahl.

- [ ] **Step 4: Typprüfung, Lint und Commit**

```bash
bunx tsc --noEmit && bun run lint
git add src/components/admin/job-history-card.tsx src/app/admin/panel/page.tsx
git commit -m "feat: Job-Historie mit Detailansicht und Semester-Vergleich"
```

---

### Task 14: Sektion „Semester verwalten"

**Files:**
- Create: `src/components/admin/semester-card.tsx`
- Modify: `src/app/admin/panel/page.tsx`

**Interfaces:**
- Consumes: Semester-API (Task 8), `refresh` aus `useCrawlJobs` (Task 10)
- Produces: `<SemesterCard semesters onChanged />`

- [ ] **Step 1: Komponente implementieren**

`src/components/admin/semester-card.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SemesterDto } from "@/types/crawl";

type Draft = {
  id: number | null;
  name: string;
  crawlUrl: string;
  modulCrawlUrl: string;
  isSelectable: boolean;
};

const emptyDraft: Draft = {
  id: null,
  name: "",
  crawlUrl: "",
  modulCrawlUrl: "",
  isSelectable: true,
};

export function SemesterCard({
  semesters,
  onChanged,
}: {
  semesters: SemesterDto[];
  onChanged: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!draft) {
      return;
    }
    setSaving(true);

    const isNew = draft.id === null;
    const response = await fetch(
      isNew ? "/api/admin/semesters" : `/api/admin/semesters/${draft.id}`,
      {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          crawlUrl: draft.crawlUrl,
          modulCrawlUrl: draft.modulCrawlUrl,
          isSelectable: draft.isSelectable,
        }),
      },
    );

    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast.error(data.error ?? "Speichern fehlgeschlagen.");
      return;
    }

    toast.success(isNew ? "Semester angelegt." : "Semester gespeichert.");
    setDraft(null);
    await onChanged();
  };

  const deleteData = async (semester: SemesterDto) => {
    const response = await fetch("/api/admin/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ semesterId: semester.id }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      toast.error(data.error ?? "Löschen fehlgeschlagen.");
      return;
    }
    toast.success(data.message ?? "Daten gelöscht.");
    await onChanged();
  };

  const deleteSemester = async (semester: SemesterDto) => {
    const response = await fetch(`/api/admin/semesters/${semester.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      toast.error(data.error ?? "Löschen fehlgeschlagen.");
      return;
    }
    toast.success("Semester gelöscht.");
    await onChanged();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Semester verwalten</CardTitle>
          <CardDescription>
            Die STiNE-Einstiegspunkte je Semester. Ohne URL lässt sich der jeweilige Crawl nicht
            starten.
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setDraft({ ...emptyDraft })}>
          <Plus className="mr-2 h-4 w-4" />
          Neu
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {semesters.length === 0 && (
          <p className="text-sm text-muted-foreground">Noch kein Semester angelegt.</p>
        )}

        {semesters.map((semester) => (
          <div
            key={semester.id}
            className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{semester.name}</span>
                {!semester.isSelectable && (
                  <span className="text-xs text-muted-foreground">(ausgeblendet)</span>
                )}
                <span className="text-xs text-muted-foreground">
                  {semester.veranstaltungenCount} Veranstaltungen · {semester.modulCount} Module
                </span>
              </div>
              <UrlLine label="Veranstaltungen" url={semester.crawlUrl} />
              <UrlLine label="Module" url={semester.modulCrawlUrl} />
            </div>

            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraft({
                    id: semester.id,
                    name: semester.name,
                    crawlUrl: semester.crawlUrl ?? "",
                    modulCrawlUrl: semester.modulCrawlUrl ?? "",
                    isSelectable: semester.isSelectable,
                  })
                }>
                <Pencil className="h-4 w-4" />
              </Button>

              <ConfirmButton
                title={`Daten von „${semester.name}" löschen?`}
                description="Veranstaltungen, Übungsgruppen, Termine und Module dieses Semesters werden gelöscht. Das Semester samt URLs bleibt bestehen."
                onConfirm={() => deleteData(semester)}
                label="Daten löschen"
              />

              <ConfirmButton
                title={`Semester „${semester.name}" löschen?`}
                description="Nur möglich, wenn keine Veranstaltungen und Module mehr daran hängen."
                onConfirm={() => deleteSemester(semester)}
                icon
              />
            </div>
          </div>
        ))}
      </CardContent>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id === null ? "Semester anlegen" : "Semester bearbeiten"}</DialogTitle>
            <DialogDescription>
              Die URLs sind die STiNE-Einstiegsseiten für den jeweiligen Crawl.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="sem-name">Name</Label>
                <Input
                  id="sem-name"
                  value={draft.name}
                  placeholder="WiSe 26/27"
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="sem-crawl">Veranstaltungs-URL</Label>
                <Input
                  id="sem-crawl"
                  value={draft.crawlUrl}
                  onChange={(e) => setDraft({ ...draft, crawlUrl: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="sem-modul">Modul-URL</Label>
                <Input
                  id="sem-modul"
                  value={draft.modulCrawlUrl}
                  onChange={(e) => setDraft({ ...draft, modulCrawlUrl: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={draft.isSelectable}
                  onChange={(e) => setDraft({ ...draft, isSelectable: e.target.checked })}
                />
                Im öffentlichen Stundenplan auswählbar
              </label>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Abbrechen
            </Button>
            <Button onClick={save} disabled={saving || !draft?.name.trim()}>
              {saving ? "Wird gespeichert…" : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function UrlLine({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return (
      <p className="text-xs text-muted-foreground">{label}: keine URL hinterlegt</p>
    );
  }

  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="truncate" title={url}>
        {label}: {url.slice(0, 60)}…
      </span>
      <button
        type="button"
        aria-label={`${label}-URL kopieren`}
        onClick={() => {
          void navigator.clipboard.writeText(url);
          toast.success("URL kopiert.");
        }}>
        <Copy className="h-3 w-3" />
      </button>
    </p>
  );
}

function ConfirmButton({
  title,
  description,
  onConfirm,
  label,
  icon,
}: {
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
  label?: string;
  icon?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline">
          {icon ? <Trash2 className="h-4 w-4" /> : label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Löschen</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 2: In die Panel-Seite einhängen**

```tsx
import { SemesterCard } from "@/components/admin/semester-card";
```

```tsx
      <SemesterCard semesters={semesters} onChanged={refresh} />
```

`refresh` aus dem Hook mit destrukturieren.

- [ ] **Step 3: Manuell prüfen**

Expected:
- „Neu" öffnet den Dialog, ein Semester mit Name und URLs lässt sich anlegen; danach erscheint es sofort in der Liste und im Start-Dropdown.
- Ein zweites Semester mit gleichem Namen erzeugt einen Fehler-Toast „Dieses Semester existiert bereits."
- Der Kopier-Button legt die vollständige URL in die Zwischenablage.
- „Semester löschen" bei einem Semester mit Daten liefert den Hinweis, erst die Daten zu löschen; nach „Daten löschen" klappt es.

- [ ] **Step 4: Typprüfung, Lint und Commit**

```bash
bunx tsc --noEmit && bun run lint
git add src/components/admin/semester-card.tsx src/app/admin/panel/page.tsx
git commit -m "feat: Semester-Verwaltung im Admin-Panel"
```

---

### Task 15: Sektion „System" und Abschluss

**Files:**
- Create: `src/components/admin/system-card.tsx`
- Modify: `src/app/admin/panel/page.tsx`

**Interfaces:**
- Consumes: `POST /api/admin/create-admin`, `POST /api/admin/reset`
- Produces: `<SystemCard onChanged />`

- [ ] **Step 1: Komponente implementieren**

`src/components/admin/system-card.tsx`:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function SystemCard({ onChanged }: { onChanged: () => Promise<void> }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const createAdmin = async () => {
    if (!username.trim() || !password) {
      setError("Username und Passwort sind erforderlich.");
      return;
    }
    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen haben.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          name: name.trim() || undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Admin konnte nicht erstellt werden.");
        return;
      }

      toast.success(`Admin „${data.admin.username}" erstellt.`);
      setUsername("");
      setPassword("");
      setName("");
    } catch {
      setError("Netzwerkfehler beim Erstellen des Admin-Accounts.");
    } finally {
      setSaving(false);
    }
  };

  const resetEverything = async () => {
    const response = await fetch("/api/admin/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      toast.error(data.error ?? "Reset fehlgeschlagen.");
      return;
    }
    toast.success(data.message ?? "Datenbank zurückgesetzt.");
    await onChanged();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System</CardTitle>
        <CardDescription>Admin-Accounts und Wartung.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">Neuen Admin erstellen</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-username">Username</Label>
              <Input
                id="admin-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-password">Passwort</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-name">Name (optional)</Label>
              <Input
                id="admin-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={createAdmin} disabled={saving} className="self-start">
            {saving ? "Wird erstellt…" : "Admin erstellen"}
          </Button>
        </div>

        {process.env.NODE_ENV !== "production" && (
          <>
            <Separator />
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium">Datenbank zurücksetzen</h3>
              <p className="text-sm text-muted-foreground">
                Löscht sämtliche Kursdaten aller Semester. In der Produktion serverseitig
                gesperrt.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="self-start">
                    Alle Kursdaten löschen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Wirklich alle Kursdaten löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Veranstaltungen, Übungsgruppen, Termine und Module aller Semester werden
                      gelöscht. Semester und ihre URLs bleiben erhalten.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={resetEverything}>Löschen</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Panel-Seite fertigstellen**

`src/app/admin/panel/page.tsx` in der Endfassung:

```tsx
"use client";

import { ActiveJobCard } from "@/components/admin/active-job-card";
import { JobHistoryCard } from "@/components/admin/job-history-card";
import { SemesterCard } from "@/components/admin/semester-card";
import { StartCrawlCard } from "@/components/admin/start-crawl-card";
import { SystemCard } from "@/components/admin/system-card";
import { useCrawlJobs } from "@/hooks/use-crawl-jobs";

export default function AdminPanel() {
  const { active, history, semesters, loading, refresh, startJob, stopJob } = useCrawlJobs();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-white">Admin-Panel</h1>

      {loading ? (
        <p className="text-white/80">Wird geladen…</p>
      ) : (
        <>
          {active && <ActiveJobCard job={active} history={history} onStop={stopJob} />}
          <StartCrawlCard semesters={semesters} active={active} onStart={startJob} />
          <JobHistoryCard history={history} semesters={semesters} />
          <SemesterCard semesters={semesters} onChanged={refresh} />
          <SystemCard onChanged={refresh} />
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Gesamtdurchlauf prüfen**

```bash
bun test
bunx tsc --noEmit
bun run lint
bun run build
```
Expected: alle Tests grün, keine Typ- oder Lint-Fehler, Build läuft durch.

Dann im Dev-Server einmal den kompletten Weg gehen:
1. Semester anlegen mit Veranstaltungs- und Modul-URL.
2. Veranstaltungs-Crawl starten, Live-Sektion beobachten, nach ein paar Minuten stoppen.
3. Zweiten Start versuchen, solange der erste noch läuft → Fehler-Toast „Es läuft bereits ein Crawl-Job."
4. Historie prüfen: gestoppter Lauf mit Dauer, Zählern, Diagramm.
5. Modul-Crawl auf demselben Semester starten und stoppen.
6. Denselben Crawl erneut starten und nach kurzer Zeit stoppen → die Semester-Zähler dürfen **nicht** doppelt hochgehen (Ergänzen-Semantik).
7. Server neu starten, während ein Job läuft; nach dem Neustart `/admin/panel` öffnen → der Job steht in der Historie mit „Server wurde neu gestartet", und ein neuer Job lässt sich starten.
8. „Daten löschen" auf dem Testsemester, danach „Semester löschen".

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/system-card.tsx src/app/admin/panel/page.tsx
git commit -m "feat: System-Sektion und vollständiges Admin-Dashboard"
```

---

## Self-Review

**Spec-Abdeckung**

| Spec-Abschnitt | Task |
| --- | --- |
| `Semester`-Felder, `@unique`, Migrations-Vorbehalt | 2 |
| `CrawlJob`-Modell, Enums, `stopRequested`, Delay-Felder, `samples` | 2 |
| Ein-Job-Sperre | 2 (Index), 6 (P2002-Behandlung), 7 (409) |
| `CrawlContext` mit `wait`/`shouldStop`/Zählern, gedrosselte Writes | 3 |
| Dateiaufteilung `src/lib/crawler/` | 1, 3, 4, 5 |
| Bugfixes 1–6 | 4 (1, 2, 6), 5 (1, 3, 4, 5), 3 (2) |
| Re-Crawl-Semantik „ergänzen" ohne Modul-Duplikate | 4, 5 |
| Fortschrittsbruch aus der Baumposition | 3 |
| Restzeit inkl. Altdaten-Prognose und Überblendung | 9, 12 |
| Messpunkte alle 30 s | 3 |
| Crawl-Job-API inkl. `reconcileOrphans` | 6, 7 |
| Semester-API | 8 |
| Reset semesterbezogen + Produktionssperre | 8 |
| Panel-Sektionen 1–5, Polling 2 s/15 s | 11, 12, 13, 14, 15 |
| recharts + shadcn-Wrapper, nur im Admin-Bereich | 10 |
| Fehlerbehandlung (Job-Fehler, Neustart, Write-Fehler) | 3, 6 |
| Testbarkeit der reinen Funktionen | 1, 3, 9 |

**Nicht in der Spec, im Plan ergänzt** (jeweils an Ort und Stelle begründet):

- **Task 11, Step 1:** `src/app/admin/layout.tsx` rendert ein zweites `<html>`/`<body>` innerhalb des Root-Layouts. Ohne Korrektur ist das Markup ungültig und der `<Toaster>` fehlt im Admin-Bereich — die Spec setzt Toasts durchgängig voraus.
- **Task 4/5:** `linkVeranstaltungToModul` prüft auf bestehende Verknüpfungen. Die Spec nennt nur die Modul-Duplikate; ohne diese Prüfung entstünden bei „ergänzen" stattdessen doppelte Join-Zeilen.
- **Task 5, Punkt 4:** Die Veranstaltungssuche im Modul-Crawl wird auf das Semester eingeschränkt. Die `stineId` ist über Semester hinweg nicht eindeutig, und die `semesterId` liegt jetzt vor.
- **Task 1, Step 1:** `@types/bun` als devDependency, sonst scheitert `next build` an den Test-Imports.

**Typkonsistenz**

`CrawlSample` (`context.ts`, Server) und `CrawlSampleDto` (`types/crawl.ts`, Client) haben identische Felder `t, r, v, d, p`. `CrawlContext`-Methoden werden in Task 4 und 5 exakt unter den in Task 3 definierten Namen aufgerufen (`wait`, `shouldStop`, `enterMenu`, `advanceMenu`, `exitMenu`, `trackRequest`, `trackMenu`, `trackVeranstaltung`, `trackUebungsgruppe`, `trackTermine`, `flush`). `StartJobArgs` aus dem Hook (Task 10) deckt sich mit `StartJobInput` aus `crawl-jobs.ts` (Task 6). `RatePoint`-Felder (`t`, `veranstaltungen`, `requests`) entsprechen den `dataKey`-Angaben in Task 12 und 13.
