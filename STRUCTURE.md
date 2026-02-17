# Projektstruktur

## Übersicht

Das Projekt folgt Best Practices für Next.js 15 mit TypeScript und ist modular aufgebaut.

## Verzeichnisstruktur

```
src/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Haupt-Stundenplan-Seite
│   ├── layout.tsx           # Root Layout mit Toaster
│   ├── admin/               # Admin-Bereich
│   │   └── panel/           # Admin Panel für Crawler
│   ├── api/                 # API Routes
│   │   ├── search/          # Veranstaltungssuche
│   │   └── admin/           # Admin APIs (crawl, reset)
│   └── info/                # Info-Seiten (contact, credits, privacy)
│
├── components/              # React-Komponenten
│   ├── ui/                  # shadcn/ui Komponenten
│   ├── event-card.tsx       # Einzelne Event-Card
│   ├── event-list.tsx       # Event-Liste mit ScrollArea
│   ├── search-dialog.tsx    # Veranstaltungssuche-Dialog
│   ├── addeventmodal.tsx    # Modal für eigene Events
│   └── weeklycalender.tsx   # Wochenkalender-Komponente
│
├── hooks/                   # Custom React Hooks
│   ├── use-events.ts        # Event-Management (CRUD + localStorage)
│   └── use-search.ts        # Suchlogik mit Debouncing
│
├── lib/                     # Utilities & Helpers
│   ├── planner-utils.ts     # Farben, Datum-Konvertierung
│   └── utils.ts             # General utilities (cn, etc.)
│
└── types/                   # TypeScript Type Definitions
    └── planner.ts           # Event, SearchResult, Visibility, etc.
```

## Komponenten-Hierarchie

```
page.tsx
├── EventList
│   └── EventCard (mehrfach)
│       └── Accordion (bei Gruppen)
├── SearchDialog
│   └── Command + CommandList
└── AddEventModal
```

## Datenfluss

1. **Events**:
   - `useEvents` Hook verwaltet State + localStorage
   - Typen aus `types/planner.ts`
   - Utils aus `lib/planner-utils.ts`

2. **Suche**:
   - `useSearch` Hook mit Debouncing (500ms)
   - API-Call zu `/api/search`
   - Prisma-Abfrage mit OR-Filter

3. **Kalender**:
   - Events → Entry[] Transformation
   - WeeklyCalender rendert Grid

## Technologie-Stack

- **Framework**: Next.js 15.5 (App Router)
- **Sprache**: TypeScript
- **Styling**: Tailwind CSS
- **UI Library**: shadcn/ui (Radix UI)
- **Icons**: lucide-react
- **Database**: PostgreSQL (Prisma ORM)
- **Notifications**: Sonner (Toast)
- **State**: React Hooks + localStorage

## API Routes

### `/api/search?search={query}`

- GET Request
- Sucht Veranstaltungen (Name, STiNE-ID, Lehrende)
- Returns: SearchResult[]

### `/api/admin/crawl`

- POST: Startet Crawl-Job für STiNE-Daten
- GET: Prüft Status eines Jobs
- Auth: Token via ADMIN_TOKEN env var

### `/api/admin/reset`

- POST: Löscht Datenbank-Einträge
- Auth: Token via ADMIN_TOKEN env var

## Environment Variables

```env
DATABASE_URL=postgresql://...
ADMIN_TOKEN=your-secret-token  # Für Admin Panel
```

## Scripts

```bash
bun dev              # Development Server
bun build            # Production Build
bun start            # Production Server
bun prisma db seed   # Datenbank mit Test-Daten füllen
```

## Best Practices

1. **Komponenten**: Klein und wiederverwendbar
2. **Hooks**: Logik aus Komponenten extrahieren
3. **Types**: Zentral in `/types` definieren
4. **Utils**: Pure Functions in `/lib`
5. **Styling**: Tailwind + CSS Variables (shadcn)
