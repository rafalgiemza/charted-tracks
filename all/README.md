# 🎵 ChartPulse

> Visualise the chart history of any song — peak positions, weeks on chart, and movement over time.

![ChartPulse homepage](./docs/screenshot-home.png)

**Live demo:** [chartpulse.vercel.app](https://chartpulse.vercel.app)

---

## What it does

- **Homepage** — UK Singles Chart Top 10 with sparklines and movement arrows (↑3 / ↓2 / NEW)
- **Song page** — full chart history on an interactive line chart (position over time, Y-axis reversed so #1 is on top)
- **Artist page** — discography with aggregate stats: best peak, total weeks, countries reached
- **Search** — debounced instant search with keyboard navigation (↑↓ arrows, Esc to close)
- **ISR** — all pages statically generated and revalidated every 24 hours, zero auth overhead

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, RSC, Server Actions) |
| Database | Supabase (Postgres) |
| ORM | Drizzle ORM + Drizzle Kit |
| UI | shadcn/ui + Recharts |
| Hosting | Vercel |
| Language | TypeScript (strict, zero `any`) |

---

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/yourusername/chartpulse.git
cd chartpulse
pnpm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, then grab the credentials from **Project Settings → Database**.

You need two connection strings:
- **Transaction pooler** — for the app (port 6543)
- **Direct connection** — for migrations (port 5432)

### 3. Set environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Transaction pooler — used by the app at runtime
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct connection — used by Drizzle Kit for migrations
DATABASE_URL_DIRECT=postgresql://postgres.[ref]:[password]@aws-0-eu-west-2.pooler.supabase.com:5432/postgres

# Supabase client (public — safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# App URL (used for OpenGraph meta tags)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run migrations

```bash
pnpm db:generate   # generate SQL from schema
pnpm db:migrate    # apply to Supabase
```

### 5. Seed the database

```bash
pnpm db:seed
```

This loads `scripts/data/uk-chart.csv` — 8 songs, 13 weeks of UK chart data. The script is idempotent: safe to run multiple times.

### 6. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database commands

```bash
pnpm db:generate   # generate migration files from schema changes
pnpm db:migrate    # apply pending migrations
pnpm db:push       # push schema directly (dev only, skips migration files)
pnpm db:studio     # open Drizzle Studio — visual DB browser
pnpm db:seed       # seed UK chart data from CSV
```

---

## Project structure

```
chartpulse/
│
├── app/
│   ├── layout.tsx                  ← root layout (Navbar, fonts)
│   ├── page.tsx                    ← homepage — UK Top 10
│   ├── loading.tsx                 ← homepage skeleton
│   ├── api/
│   │   └── search/route.ts         ← GET /api/search?q=
│   ├── songs/[slug]/
│   │   ├── page.tsx                ← song chart history
│   │   └── loading.tsx
│   └── artists/[slug]/
│       ├── page.tsx                ← artist discography
│       └── loading.tsx
│
├── components/
│   ├── nav/
│   │   ├── Navbar.tsx              ← sticky header (Server Component)
│   │   ├── SearchBar.tsx           ← debounced search input (client)
│   │   └── SearchResults.tsx       ← dropdown results (client)
│   ├── charts/
│   │   ├── ChartLine.tsx           ← Recharts LineChart (client)
│   │   ├── ChartTooltip.tsx        ← custom tooltip
│   │   ├── StatsCards.tsx          ← peak / weeks / debut
│   │   └── SparkLine.tsx           ← mini 8-week sparkline (client)
│   ├── home/
│   │   ├── TopChartTable.tsx       ← Top 10 list
│   │   ├── TopChartRow.tsx         ← single chart entry row
│   │   └── MovementBadge.tsx       ← ↑3 / ↓2 / NEW / RE badge
│   └── artists/
│       ├── ArtistHeader.tsx        ← avatar, name, stat cards
│       ├── DiscographyTable.tsx    ← song list with headers
│       └── DiscographyRow.tsx      ← single song row + sparkline
│
├── db/
│   ├── index.ts                    ← Drizzle client (postgres-js)
│   ├── schema/
│   │   ├── artists.ts
│   │   ├── songs.ts
│   │   ├── charts.ts
│   │   ├── chart-entries.ts        ← main entity — position per song per week
│   │   ├── relations.ts            ← all Drizzle relations (avoids circular imports)
│   │   └── index.ts
│   └── migrations/                 ← generated SQL files (do not edit)
│
├── lib/
│   └── queries/
│       ├── songs.ts                ← getSongBySlug, searchSongs
│       ├── charts.ts               ← getSongChartHistory, getLatestChart
│       ├── artists.ts              ← getArtistPageData (GROUP BY, zero N+1)
│       ├── home.ts                 ← getHomepageData (3 queries total)
│       └── index.ts
│
├── scripts/
│   ├── seed.ts                     ← idempotent seed script
│   ├── lib/
│   │   ├── csv.ts                  ← CSV parser
│   │   └── slugify.ts              ← URL slug generator
│   └── data/
│       └── uk-chart.csv            ← sample chart data
│
├── drizzle.config.ts
├── .env.example
└── package.json
```

---

## Schema overview

```
artists
  └── songs  (artist_id FK)
        └── chart_entries  (song_id FK, chart_id FK)
              └── charts
```

`chart_entries` is the core table — one row per song per chart per week:

| column | type | notes |
|---|---|---|
| `song_id` | uuid FK | |
| `chart_id` | uuid FK | which country/chart |
| `position` | int | 1–100 |
| `chart_date` | date | weekly, usually Friday |
| `peak_position` | int | best position up to this date |
| `weeks_on_chart` | int | running total |

Indexes: unique on `(song_id, chart_id, chart_date)`, plus two composite indexes for fast chart-history and current-chart queries.

---

## Adding more chart data

The seed script accepts any CSV with this header:

```
chart_date,position,title,artist,peak_position,weeks_on_chart
```

To add a second country:

```typescript
// scripts/seed.ts — add after the UK chart block
await db.insert(charts).values({
  countryCode: "PL",
  countryName: "Poland",
  chartName:   "Polish Singles Chart",
  isActive:    true,
}).onConflictDoNothing();
```

Then add `scripts/data/pl-chart.csv` and update `seed.ts` to process it. The chart page at `/charts/pl` and multi-country compare view pick it up automatically.

---

## Deploy to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "initial commit"
git push origin main
```

### 2. Import to Vercel

Go to [vercel.com/new](https://vercel.com/new), import the repo, and set the following environment variables in the Vercel dashboard:

```
DATABASE_URL              ← transaction pooler URL (port 6543)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL       ← https://your-project.vercel.app
```

> **Important:** Use the **transaction pooler** URL (port 6543) for `DATABASE_URL` in production — Vercel's serverless functions don't support persistent connections. The direct URL (port 5432) is only needed for `pnpm db:migrate` run locally.

### 3. Run migrations against production

```bash
DATABASE_URL=<direct_connection_url> pnpm db:migrate
DATABASE_URL=<direct_connection_url> pnpm db:seed
```

### 4. Deploy

Vercel deploys automatically on every push to `main`. ISR means chart pages rebuild every 24 hours without a redeploy.

---

## Pre-deploy checklist

```
[ ] pnpm typecheck        — zero TypeScript errors
[ ] pnpm build            — clean production build
[ ] DATABASE_URL set in Vercel dashboard
[ ] NEXT_PUBLIC_APP_URL set to production domain
[ ] pnpm db:migrate run against production DB
[ ] pnpm db:seed run against production DB
[ ] /songs/[slug] loads and chart renders
[ ] /artists/[slug] loads with stats
[ ] Search returns results
[ ] Lighthouse Performance ≥ 90
```

---

## Roadmap

### V2 — Multi-country + Stats
- Polish, US, German charts
- `/compare` — multiple songs or countries on one chart
- Aggregate stats: how many countries a song reached

### V3 — AI Music Taste Analyzer
- Paste a list of favourite songs
- Claude analyses your taste — eras, genres, patterns
- Shareable "taste score" card

---

## .env.example

```env
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## License

MIT
