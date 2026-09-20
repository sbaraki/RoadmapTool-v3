# RoadmapTool-v3 — Portfolio Exhibitions Roadmap

Interactive portfolio timeline for planning museum exhibitions across galleries:
drag-and-drop schedule bars, phase segments, milestones, key-date bands,
scenarios, undo/redo, CSV + ledger PDF export, and optional Supabase cloud
backup of all scenarios.

## Features

- Timeline with calendar/fiscal-year/quarter/month headers, zoom, scroll-to-today
- Galleries (temporary/permanent) with collapsible lanes and sidebar ordering
- Exhibition projects: date-range or single-date, status colors, open/close pills
- Phases (pre/post tracks, resizable durations) and milestones/checkpoints (draggable)
- Key-date bands with annual recurrence and lane packing
- Scenarios: create, duplicate, rename, delete, switch (localStorage library)
- Undo/redo with coalesced history for typing bursts
- CSV export (`Project Main` / `Phase (Pre|Post)` / `Checkpoint` rows)
- Ledger (17×11" landscape) PDF export with metadata header
- Cloud backup/restore via Supabase email magic links (manual backup, merge or replace)

## Stack

React 19 + TypeScript + Vite, Tailwind CSS v4, Zustand v5, dnd-kit,
date-fns, html-to-image + jsPDF, Supabase JS v2, Vitest.

## Getting started

```bash
npm install
cp .env.example .env   # local dev only; never commit .env
npm run dev            # http://localhost:5173
```

Useful scripts:

```bash
npm run dev      # local dev server
npm run build    # typecheck + production build -> dist/
npm run preview  # preview the production build
npm run lint     # eslint
npm test         # vitest run (unit regression tests)
```

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Only for cloud backup | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Only for cloud backup | Supabase anon public key |

Without these, the app runs fully offline on localStorage and the
Settings cloud panel reports "Supabase is not configured."

## Supabase setup (cloud backup)

1. Create a Supabase project and enable email auth
   (Authentication -> Providers -> Email, magic links enabled).
2. In the Supabase SQL editor, run `supabase/schema.sql` — it creates the
   `public.scenario_libraries` table (`user_id`, `data`, `updated_at`)
   with row-level security so users manage only their own row.
3. Set local vars (`.env`) and deploy vars (GitHub
   `Settings -> Secrets and variables -> Actions`: `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY` — vars or secrets both work).
4. In the app, open Settings -> Cloud Scenario Backup, send yourself a
   magic link, then Back Up / Restore (merge or replace).

## Deploy

GitHub Pages via Actions is the canonical path
(`.github/workflows/deploy.yml`): push to `main` runs
`npm ci`, `npm run lint`, `npm test`, `npm run build`, then publishes
`dist/` with Pages. No `gh-pages` branch workflow is used.

## Project structure

```
src/
  App.tsx / main.tsx / index.css
  screens/PortfolioTimeline.tsx   # load, seed, autosave, layout wiring
  components/
    layout/   # AppShell, Header (toolbar), Sidebar (portfolio ordering)
    timeline/ # Timeline, TimelineHeader, TimelineGrid, GalleryLane,
              # ProjectBar, PhaseBar, MilestoneMarker, KeyDateBand,
              # MilestoneEditModal
    project/  # ProjectDetailPanel (edit drawer/modal)
    settings/ # SettingsModal, GalleryEditor, PhaseTypeEditor, KeyDateEditor
    ui/       # Button, IconButton, Input, Select, Modal
  store/
    useStore.ts  # portfolio state, scenarios, history, cloud actions
    history.ts   # snapshot helpers
  hooks/      # useAutosave (portfolio-data-only), useKeyboard (undo/redo)
  utils/      # date, csv, pdfExport, color, id, seedData,
              # supabaseClient, supabaseSync
  data/defaults.ts
supabase/schema.sql               # cloud backup table + RLS
```

## Data model

- Local persistence key: `portfolio_tool_v2` in localStorage, holding a
  `ScenarioLibrary` (`version: 3`, `activeScenarioId`, `scenarios[]`).
- Each scenario holds `PortfolioData`: museum name, galleries, phase types,
  exhibitions (with phases + checkpoints), key dates, timeline range,
  month width, collapsed lanes, milestone/sidebar visibility.
- First launch with no stored library seeds demo data (`utils/seedData.ts`).
- Autosave debounces 300ms and writes only when portfolio data changes.

## PDF export notes

Export renders the `.timeline-container` to a canvas, then fits it on one
ledger-landscape page with a title/scenario/range header. The exporter
picks the highest pixel ratio (3 → 2 → 1.5 → 1 → 0.75) that fits a
~24MP / 12000px budget and retries downward on capture failure, so very
large timelines export at reduced sharpness instead of crashing. If an
export fails, the header button reports it — try zooming out or collapsing
lanes first.

## Troubleshooting sync

- "Supabase is not configured": set both `VITE_*` vars and rebuild.
- "Sign in before backing up/restoring": complete the magic-link sign-in first.
- "No cloud backup found": no row exists yet for that user — back up first.
- Row-level errors on backup/restore usually mean `supabase/schema.sql`
  was not applied or email auth is off.
