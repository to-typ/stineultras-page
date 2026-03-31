# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev       # Start development server (http://localhost:3000)
bun run build     # Build for production
bun run start     # Start production server
bun run lint      # Run ESLint

bunx prisma generate        # Regenerate Prisma client after schema changes
bunx prisma migrate dev     # Create and apply a new migration
bunx prisma studio          # Open Prisma Studio (database browser)

docker-compose up           # Start full stack (app + PostgreSQL + Caddy)
```

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Minimum 32 characters

## Architecture

**STiNE Ultras** is a course schedule planner for University of Hamburg students. It scrapes course data from STiNE (the university's official registration system) and provides a modern UI to build and share timetables.

### Stack
- **Next.js 15 (App Router)** with React 19 and TypeScript
- **Prisma + PostgreSQL** for data persistence
- **JWT via `jose`** for admin authentication (HTTP-only cookies, 30-day expiry)
- **Bun** as package manager and runtime
- **Caddy** as reverse proxy in production (Docker Compose)

### Key Patterns

**State Management** — No global state library. All schedule state lives in custom hooks:
- `use-stundenplan.ts` — manages multiple timetables (create/rename/delete/load)
- `use-events.ts` — event CRUD within the active timetable
- `use-search.ts` — course search against the API

**Data Flow** — The home page (`src/app/page.tsx`) composes these hooks and passes handlers down to components. Schedules are stored in `localStorage` as serialized JSON.

**Schedule Sharing** — `src/lib/import-export.ts` encodes a schedule as Base64 in the URL for shareable links and generates ICS files for calendar export.

**API Routes** (`src/app/api/`):
- `search/` — full-text course search
- `semesters/` — available semesters
- `moduls/` — module data
- `auth/` — login/logout/session (JWT cookie)
- `admin/*` — protected endpoints for crawling STiNE data and managing modules

**Admin Area** (`src/app/admin/`) — protected by Next.js middleware (`src/middleware.ts`) which checks the JWT cookie on all `/admin/*` and `/api/admin/*` routes.

**Database Models** (see `prisma/schema.prisma`):
- `Semester` → `Veranstaltung` (courses) → `Termin` (individual time slots)
- `Veranstaltung` → `Uebungsgruppe` (exercise groups) → `Termin`
- `Modul` ↔ `Veranstaltung` via `VeranstaltungInModul` join table
- `Admin` — stores hashed passwords (bcryptjs, 10 rounds)

### Path Alias
`@/*` maps to `src/*` — use this for all internal imports.
