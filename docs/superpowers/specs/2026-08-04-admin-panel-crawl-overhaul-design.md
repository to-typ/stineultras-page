# Admin-Panel & Crawl-Jobs — Überarbeitung

**Datum:** 2026-08-04
**Status:** Design freigegeben, Implementierung ausstehend

## Ziel

Das Admin-Panel soll eine echte Übersicht über Crawl-Jobs bieten — welcher Job läuft
gerade, wie weit ist er, wie lange dauert es noch, was lief zuletzt — und das Starten
von Jobs soll ohne Code-Änderung möglich sein. Heute sind STiNE-URLs und Semesternamen
im Quelltext hinterlegt, Jobs leben in einer flüchtigen `Map` pro Route-Modul, und die
Bedienung läuft über `alert()` und `document.getElementById`.

**Die Crawl-Logik selbst — Traversierung des STiNE-Menübaums und das Parsen der
HTML-Seiten — bleibt inhaltlich unverändert.** Angefasst wird nur, was Konfiguration,
Job-Verwaltung und Instrumentierung betrifft, plus die unten explizit benannten Bugs.

## Ist-Zustand und seine Probleme

| Fundstelle | Problem |
| --- | --- |
| `src/app/api/admin/crawl/route.ts:29-35` | Drei STiNE-URLs als Konstanten, `switch` auf Semester-Strings (`"WiSe 26/27"` etc.) |
| `src/app/api/admin/crawl-moduls/route.ts:28-32` | Dieselben URLs nochmal, plus `switch` **ohne `break`** — `"WiSe 25/26"` fällt auf die SoSe-26-URL durch |
| `src/app/api/admin/crawl-moduls/route.ts:203` | `const semId = 5; //TODO` — hart verdrahtete Semester-ID |
| `src/app/api/admin/crawl-moduls/route.ts:81-85` | `prisma.modul.create` ohne `semester`-Verknüpfung → Module ohne Semester |
| beide Routes, `let crawlStopFlag = false` | Modulglobal und **wird nie zurückgesetzt** — nach einem Stop bricht jeder weitere Crawl sofort ab |
| beide Routes, `const jobs = new Map()` | Getrennte Registries pro Modul, weg nach Neustart, nur `GET ?jobId=` (kein Listing) |
| `src/app/api/admin/crawl/route.ts:68-72` | `prisma.semester.create` bei jedem Lauf → Duplikat-Semester bei jedem Re-Crawl |
| beide Routes | `findSubmenus`, `findVeranstaltungen` u. a. identisch dupliziert |
| `src/app/api/admin/reset/route.ts` | Löscht die komplette Datenbank; die einzige Absicherung ist `NODE_ENV === "development"` **im Frontend** |
| `src/app/admin/panel/page.tsx` | `alert()`, `console.log`, `document.getElementById("jobId")`, Job-ID manuell abtippen |

## Entscheidungen

| Frage | Entscheidung |
| --- | --- |
| Wo leben die Crawl-URLs? | In der DB am `Semester` |
| Wie werden Jobs verwaltet? | `CrawlJob`-Tabelle in der DB |
| Umfang der Crawl-Änderungen | Bugfixes + Fortschritts-Instrumentierung + Deduplizierung; Parsing/Traversierung unverändert |
| Parallele Jobs | Nur ein Job gleichzeitig, systemweit |
| Panel-Struktur | Ein Dashboard mit fünf Sektionen |
| Re-Crawl eines befüllten Semesters | Ergänzen, nicht ersetzen |
| Timeouts | Pro Job beim Start konfigurierbar (an/aus + Basis + Jitter) |
| Chart-Library | `recharts` mit shadcn-Wrapper, nur im Admin-Bereich importiert |

## Datenmodell

### `Semester` — erweitert

```prisma
model Semester {
  id              Int      @id @default(autoincrement())
  name            String   @unique
  isSelectable    Boolean  @default(true)
  crawlUrl        String?
  modulCrawlUrl   String?
  veranstaltungen Veranstaltung[]
  module          Modul[]
  crawlJobs       CrawlJob[]
}
```

`crawlUrl` ist der STiNE-Einstiegspunkt für den Veranstaltungs-Crawl, `modulCrawlUrl`
der für den Modul-Crawl. Beide optional, weil ein Semester angelegt sein kann, bevor die
URLs bekannt sind. Damit entfallen `stineURL2526`, `stineURL26`, `stineURL2627` und
beide `switch`-Blöcke ersatzlos.

`@unique` auf `name` verhindert die bisher möglichen Duplikat-Semester.

> **Migrations-Vorbehalt:** Existieren in der Produktions-DB bereits Semester mit
> gleichem Namen (durch die wiederholten `semester.create`-Aufrufe gut möglich), schlägt
> die Migration fehl. Vor dem Deploy prüfen:
> `SELECT name, count(*) FROM "Semester" GROUP BY name HAVING count(*) > 1;`
> Gefundene Duplikate müssen vorher manuell zusammengeführt werden — die Veranstaltungen
> des einen Semesters auf das andere umhängen, dann das leere löschen.

### `CrawlJob` — neu

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

  currentUrl    String?
  menus                  Int   @default(0)
  veranstaltungen        Int   @default(0)
  uebungsgruppen         Int   @default(0)
  termine                Int   @default(0)
  requests               Int   @default(0)
  progress      Float          @default(0)
  samples       Json           @default("[]")

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

`stopRequested` pro Zeile ersetzt das globale `crawlStopFlag` und behebt damit, dass ein
einziger Stop bisher alle künftigen Crawls blockiert.

`delayBaseMs` / `delayJitterMs` ersetzen die Modulkonstanten `standardTimeout` und
`randomTimeout`. Beide `0` bedeutet „ohne Verzögerung". Weil die Werte am Job hängen,
steht in der Historie mit drin, unter welchen Bedingungen ein Lauf entstand.

`samples` ist ein JSON-Array von Messpunkten (siehe *Fortschritt und Restzeit*). Eine
eigene Tabelle lohnt nicht: pro Job existiert genau ein Schreiber (also keine
Race-Condition), es wird nie analytisch darüber abgefragt, und ein Vier-Stunden-Lauf
kommt auf rund 480 Einträge (~20 kB).

## Crawler-Struktur

### `CrawlContext`

Delays, Abbruchprüfung und Fortschrittszählung müssen alle denselben Weg durch die
rekursiven Funktionen nehmen. Statt sie einzeln durchzureichen, gibt es ein Objekt pro
Job:

```ts
class CrawlContext {
  constructor(jobId: string, delayBaseMs: number, delayJitterMs: number)

  async wait(): Promise<void>       // ersetzt setTimeout(standardTimeout + random*randomTimeout)
  async shouldStop(): Promise<boolean>  // liest stopRequested des eigenen Jobs
  enterMenu(childCount: number): void   // pusht einen Fortschritts-Frame
  advanceMenu(): void                   // zählt den Index des obersten Frames hoch
  exitMenu(): void                      // poppt den Frame
  trackVeranstaltung(): void
  trackUebungsgruppe(): void
  trackTermine(n: number): void
  setCurrentUrl(url: string): void
}
```

Der Context puffert Zähler im Speicher und schreibt sie **gedrosselt** (höchstens alle
2 s) in die `CrawlJob`-Zeile, damit nicht jeder HTTP-Request einen DB-Write auslöst.
`shouldStop()` arbeitet auf einem zwischengespeicherten Wert, der im selben 2-Sekunden-Takt
aufgefrischt wird — ein Stop greift also spätestens nach einem Menüknoten, was dem
heutigen Verhalten entspricht.

### Dateiaufteilung

Der duplizierte Code zieht nach `src/lib/crawler/`:

| Datei | Inhalt |
| --- | --- |
| `parse.ts` | `findSubmenus`, `findVeranstaltungen`, `findTermine`, `findUebungsgruppen`, `getVeranstaltungData`, `getUebungsgruppeData` — 1:1 übernommen, Regexe unverändert |
| `veranstaltungs-typ.ts` | `mapVeranstaltungsTyp` (der ~200-Zeilen-`switch`) |
| `context.ts` | `CrawlContext` |
| `veranstaltungen.ts` | `crawlMenu`, `crawlVeranstaltung`, `crawlUebungsgruppe`, `crawlTermin` |
| `moduls.ts` | Modul-Crawl |
| `src/lib/crawl-jobs.ts` | Job-Lebenszyklus (siehe unten) |

Die Route-Handler werden dadurch dünn: Input validieren, `crawl-jobs` aufrufen, JSON
zurückgeben.

### Bugfixes im Crawl-Pfad

Diese und nur diese Verhaltensänderungen sind Teil des Umbaus:

1. **Kein `semester.create` mehr im Crawl.** `crawlSemester` bekommt die `semesterId` aus
   dem Job und verknüpft damit. Das Semester wird ausschließlich über die
   Semester-Verwaltung angelegt.
2. **`crawlStopFlag` → `stopRequested` pro Job.**
3. **`const semId = 5`** in `moduls.ts` durch die Semester-ID des Jobs ersetzt.
4. **Modul-Erzeugung im Modul-Crawl verknüpft das Semester** (fehlt heute komplett).
5. **`switch` ohne `break`** entfällt mit dem `switch` selbst.
6. **Module werden nicht mehr dupliziert.** Beide Crawl-Pfade legen Module bisher blind
   per `prisma.modul.create` an; bei „ergänzen"-Semantik entstünde bei jedem Re-Crawl ein
   zweiter Satz. Neu: erst `findFirst({ where: { name, semesterId } })`, nur bei
   Nichttreffer anlegen — analog zur bereits vorhandenen `stineId`-Prüfung bei
   `Veranstaltung`.

Nicht angefasst: sämtliche Regexe, die Reihenfolge der Traversierung, die
Datums-/Zeit-Behandlung in `crawlTermin`, das Typ-Mapping.

### Re-Crawl-Semantik

Ergänzen, nicht ersetzen. Bestehende Daten bleiben stehen; die `stineId`-Prüfung bei
`Veranstaltung` und die neue Namensprüfung bei `Modul` verhindern Doppelte. Wer wirklich
neu aufsetzen will, löscht die Semesterdaten vorher gezielt über die Semester-Sektion.

## Fortschritt und Restzeit

### Fortschrittsbruch aus der Baumposition

Der Crawler weiß vorab nicht, wie groß der Menübaum ist. Der `CrawlContext` führt
deshalb einen Stack aus Frames `{ index, total }`: bei jedem `crawlMenu` wird gepusht,
wie viele Untermenüs gefunden wurden, und beim Abarbeiten der Index hochgezählt. Daraus
ergibt sich ein Fortschrittsbruch

```
p = Σ_d  ( index_d / total_d ) × Π_{j<d} ( 1 / total_j )
```

Beispiel: Wurzel hat 12 Untermenüs, wir sind beim dritten und darin beim siebten von
20 → `p = 2/12 + (1/12)(6/20) ≈ 0,192`.

Das setzt voraus, dass Geschwisterteilbäume ähnlich groß sind — stimmt nicht exakt,
korrigiert sich aber mit fortschreitender Tiefe selbst und braucht keine Altdaten.
Frames mit `total = 0` werden übersprungen.

### Restzeit

Primär: `eta = verstrichen × (1 - p) / p`, geglättet über die letzten Messpunkte
(gleitender Mittelwert über die letzten 5 Samples), damit die Zahl nicht springt.

Solange `p < 0,02` ist, ist diese Extrapolation instabil. Für diese Anfangsphase greift
eine Prognose aus Altdaten: der letzte `COMPLETED`-Job desselben Typs liefert seine
`requests`-Gesamtzahl als `erwarteteRequests`, daraus
`eta = (erwarteteRequests - requests) × ØRequestdauer`, wobei
`ØRequestdauer = verstrichen / requests` des laufenden Jobs ist. Liegt `requests` bereits
über `erwarteteRequests`, wird der Altdaten-Zweig verworfen und sofort die
Baum-Schätzung gezeigt.
Zwischen `p = 0,02` und `p = 0,05` wird linear von der Altdaten- auf die
Baum-Schätzung übergeblendet. Existiert kein abgeschlossener Vorlauf, zeigt das Panel in
der Anfangsphase „Restzeit wird ermittelt" statt einer Zahl.

Die Anzeige wird bewusst grob gerundet („noch ca. 2 h 15 min"), um keine Genauigkeit zu
suggerieren, die die Schätzung nicht hat.

### Messpunkte

Alle 30 s hängt der Context einen Eintrag an `samples` an:

```ts
type CrawlSample = {
  t: number;   // ms seit startedAt
  r: number;   // requests kumulativ
  v: number;   // veranstaltungen kumulativ
  d: number;   // termine kumulativ
  p: number;   // Fortschrittsbruch
};
```

Kumulative Werte, keine Raten — Raten pro Minute bildet das Frontend durch
Differenzbildung zwischen aufeinanderfolgenden Samples. Das hält die gespeicherten Daten
verlustfrei und erlaubt später andere Fensterbreiten ohne Datenmodelländerung.

## API

Die bisherigen Routes `/api/admin/crawl` und `/api/admin/crawl-moduls` entfallen. Beide
Crawl-Typen laufen durch dieselbe Registry — anders gäbe es keine gemeinsame Übersicht.

### Crawl-Jobs

| Methode & Pfad | Verhalten |
| --- | --- |
| `GET /api/admin/crawl-jobs` | `{ active: Job \| null, history: Job[] }` — Historie auf die letzten 25 begrenzt, jeweils mit Semestername. `samples` wird in der Liste weggelassen (Payload), nur im Detail geliefert |
| `POST /api/admin/crawl-jobs` | Start. Body `{ typ, semesterId, delayBaseMs, delayJitterMs }` |
| `GET /api/admin/crawl-jobs/[id]` | Einzeljob inklusive `samples` |
| `POST /api/admin/crawl-jobs/[id]/stop` | setzt `stopRequested = true`, antwortet sofort |

Fehlerfälle beim Start:

- **409** samt dem laufenden Job, wenn bereits einer `PENDING` oder `RUNNING` ist
- **400**, wenn dem Semester die für den Typ nötige URL fehlt
- **400** bei `delayBaseMs`/`delayJitterMs` außerhalb `0…60000`

Beim ersten Zugriff nach einem Server-Neustart läuft `reconcileOrphans()`: alle Jobs in
`PENDING`/`RUNNING` werden auf `ERROR` gesetzt mit `error = "Server wurde neu gestartet"`.
Ohne das würde ein verwaister Job die Ein-Job-Sperre dauerhaft blockieren.

### Semester-Verwaltung

| Methode & Pfad | Verhalten |
| --- | --- |
| `GET /api/admin/semesters` | Alle Semester inkl. `isSelectable = false`, mit URLs und Anzahl Veranstaltungen/Module |
| `POST /api/admin/semesters` | Anlegen `{ name, crawlUrl?, modulCrawlUrl?, isSelectable }`; **409** bei Namenskonflikt |
| `PATCH /api/admin/semesters/[id]` | Name, URLs, `isSelectable` ändern |
| `DELETE /api/admin/semesters/[id]` | Nur wenn keine Veranstaltungen/Module dranhängen, sonst **409** mit Hinweis, erst die Daten zu löschen |

`GET /api/semesters` (öffentlich) bleibt unverändert und filtert weiter auf
`isSelectable`.

### Reset

`POST /api/admin/reset` wird umgebaut:

- Mit `{ semesterId }`: löscht gezielt die Daten *eines* Semesters in der Reihenfolge
  Termin → Uebungsgruppe → VeranstaltungInModul → Modul → Veranstaltung, jeweils
  eingeschränkt auf dieses Semester. Das Semester selbst samt URLs bleibt erhalten. In
  einer Transaktion.
- Ohne `semesterId` (globaler Rundumschlag): weiterhin möglich, aber **serverseitig** auf
  `NODE_ENV !== "production"` gesperrt — heute prüft das nur das Frontend, die Route ist
  offen.

## Panel

`/admin/panel`, eine Seite, fünf `Card`-Sektionen. Polling von
`GET /api/admin/crawl-jobs` alle 2 s solange ein Job läuft, sonst alle 15 s. Kein SSE:
bei einem Lauf, der stundenlang alle 1–2 s einen Request macht, bringt Polling dieselbe
gefühlte Aktualität ohne Reconnect-Probleme hinter Caddy.

**1 — Crawl starten.** Semester-`Select` (zeigt pro Eintrag, ob die jeweilige URL
hinterlegt ist), Typ-Auswahl als `ButtonGroup`, Verzögerungs-Schalter mit Basis- und
Jitter-Feld (vorbelegt 1000/1000), Start-Button. Fehlt die passende URL, ist Start
deaktiviert mit Hinweis und Sprung in die Semester-Sektion. Bei ausgeschalteter
Verzögerung ein sichtbarer Warnhinweis, dass der Lauf die Uni-Server ungebremst trifft.
Läuft schon ein Job, ist die Sektion gesperrt.

**2 — Laufender Job** (nur sichtbar, wenn einer läuft). Kopfzeile mit Semester, Typ,
Status-Badge und Laufzeit. Darunter Fortschrittsbalken mit Prozent, Restzeit und
voraussichtlicher Endzeit. Dann KPI-Kacheln: Laufzeit, Ø Sekunden pro Veranstaltung,
Requests gesamt, Menüs / Veranstaltungen / Übungsgruppen / Termine. Dann das
Durchsatz-Chart (Flächendiagramm, letzte 60 min, Veranstaltungen/min und Requests/min) —
daran sieht man sofort, wenn STiNE drosselt oder der Lauf hängt. Unten klein die aktuell
abgerufene URL. Stopp-Button mit `AlertDialog`-Rückfrage; nach Bestätigung wechselt der
Badge sofort auf „Stopp angefordert", weil der Crawler erst am nächsten Menüknoten
abbricht und das sonst wie ein Hänger aussieht.

**3 — Job-Historie.** Tabelle der letzten 25 Läufe: Zeitpunkt, Semester, Typ,
Status-Badge, Dauer, Veranstaltungen/Termine, Delay-Einstellung. Zeilen per `Accordion`
aufklappbar für Fehlermeldung und das Durchsatz-Chart des Laufs (lädt `samples` per
Detail-Endpoint nach). Darunter ein Balkendiagramm Semester-Vergleich mit Veranstaltungs-
und Modulzahl aus der DB — damit ist auf einen Blick sichtbar, ob ein Lauf plausibel
vollständig war.

**4 — Semester verwalten.** Tabelle mit Name, beiden URLs (gekürzt, mit Kopier-Button),
`isSelectable`-Schalter, Anzahl Veranstaltungen/Module. Anlegen und Bearbeiten über
`Dialog`. Pro Zeile „Daten löschen" (Reset mit `semesterId`) und „Semester löschen" (nur
wenn leer), beide mit `AlertDialog`.

**5 — System.** Das bestehende Admin-anlegen-Formular, in eine `Card` gefasst und mit
Inline-Validierung statt `alert()`. Darunter der globale DB-Reset, sichtbar nur außerhalb
der Produktion, passend zur neuen serverseitigen Sperre.

Durchgängig `sonner`-Toasts statt `alert()`/`console.log`. `document.getElementById`
entfällt vollständig; Job-IDs muss niemand mehr abtippen.

### Charts

`recharts` als neue Dependency plus die shadcn-`chart.tsx`-Wrapper-Komponente in
`src/components/ui/`. Import ausschließlich in Admin-Komponenten, damit der öffentliche
Stundenplan-Bundle unberührt bleibt. Farben aus den vorhandenen Tailwind-Tokens, damit
Light und Dark ohne Sonderbehandlung funktionieren.

## Fehlerbehandlung

- Ein fehlgeschlagener HTTP-Request in STiNE lässt den Job wie bisher scheitern; die
  Fehlermeldung landet in `CrawlJob.error` und wird in der Historie angezeigt.
- Server-Neustart während eines Laufs → `reconcileOrphans()` markiert den Job als `ERROR`.
  Bereits geschriebene Daten bleiben in der DB; ein erneuter Lauf ergänzt sie.
- Fehlgeschlagene Schreibvorgänge der Fortschrittsdrosselung dürfen den Crawl **nicht**
  abbrechen: sie werden geloggt und übersprungen.

## Testbarkeit

Die reinen Parse-Funktionen in `parse.ts` und `veranstaltungs-typ.ts` sind ohne Netzwerk
und ohne DB testbar (HTML rein, strukturierte Daten raus) — das ist der Hauptgewinn der
Aufteilung. Die Fortschrittsberechnung im `CrawlContext` ist ebenfalls rein
(Frame-Stack rein, Bruch raus) und lässt sich gegen von Hand gerechnete Beispiele prüfen.
Das Projekt hat aktuell kein Test-Setup; ob eines eingeführt wird, entscheidet der
Implementierungsplan.

## Bewusst nicht enthalten

- Kein Scheduler / keine automatischen Crawls — Jobs werden weiterhin von Hand gestartet.
- Kein Wiederaufsetzen abgebrochener Jobs an der Abbruchstelle; ein neuer Lauf ergänzt
  die fehlenden Daten.
- Keine Änderung an den Parse-Regexen, auch wenn manche fragil aussehen.
- Keine Überarbeitung von `/admin/modul/doppler` und `/admin/modul/tinder`.
