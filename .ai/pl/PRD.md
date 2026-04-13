# PRD — ChartedTracks

> **Dokument:** Product Requirements Document  
> **Wersja:** 1.0  
> **Status:** Draft  
> **Stack:** Next.js 15 · Supabase · Drizzle ORM · shadcn/ui · Vercel · TypeScript

---

## 1. Cel produktu

ChartedTracks to aplikacja webowa do wizualizacji historii list przebojów muzycznych. Użytkownik może sprawdzić, jak dana piosenka radziła sobie na listach przebojów w różnych krajach — kiedy debiutowała, jak długo pozostawała w Top 10, jaki był jej szczyt popularności.

Aplikacja jest przeznaczona do portfolio fullstack developera i musi demonstrować:

- nowoczesną architekturę Next.js (App Router, RSC, Server Actions)
- type-safe ORM z migracjami (Drizzle + Supabase)
- interaktywne wykresy danych
- integrację z AI (V3)

---

## 2. Użytkownicy

**Główna persona — muzyczny ciekawski**  
Osoba chcąca sprawdzić historię konkretnej piosenki lub artysty na listach przebojów. Nie loguje się, nie tworzy konta — po prostu przegląda.

**Dodatkowa persona (V3) — osoba oceniająca swój gust muzyczny**  
Chce wkleić listę ulubionych piosenek i otrzymać analizę swojego gustu muzycznego opartą na danych z list przebojów.

**Brak persony administratora** — dane są wprowadzane przez seedy i skrypty, nie przez panel CMS.

---

## 3. Zakres wersji

### V1 — MVP (brytyjska lista przebojów)

**Cel:** działająca aplikacja z jedną listą przebojów (UK Singles Chart), wykresem historii pozycji i podstawową nawigacją.

**Co wchodzi:**

- Strona główna z aktualnym Top 10 UK i miniaturą wykresu tygodnia
- Strona piosenki `/songs/[slug]` z wykresem pozycji w czasie
- Strona artysty `/artists/[slug]` z listą jego piosenek i ich historią
- Strona listy `/charts/gb` z widokiem tygodniowym
- Wyszukiwarka (full-text search po tytule i artyście)
- Seed danych UK Singles Chart (dane historyczne CSV)
- ISR caching (revalidate co 24h)

**Co nie wchodzi w V1:**

- inne kraje niż GB
- porównywanie piosenek
- statystyki zbiorcze
- AI

---

### V2 — Multi-country + Aggregate Stats

**Cel:** rozszerzenie o kolejne listy przebojów i statystyki zbiorcze.

**Co wchodzi:**

- Obsługa wielu krajów (PL, US, DE, FR — konfigurowalna lista)
- Strona porównania `/compare` — kilka piosenek lub krajów na jednym wykresie
- Aggregate stats na stronie piosenki: peak position, total weeks on chart, liczba krajów
- Filtrowanie po roku na wykresie
- Strona `/charts` z listą wszystkich obsługiwanych list

---

### V3 — AI Music Taste Analyzer

**Cel:** viralowy feature portfolio — analiza gustu muzycznego oparta na danych ChartedTracks.

**Co wchodzi:**

- Strona `/taste` — formularz: użytkownik wkleja listę ulubionych piosenek (lub wybiera z bazy)
- Server Action wywołujący Claude API
- Odpowiedź: analiza stylu, dekad, trendów, unikatowy "taste score"
- Udostępnianie wyniku (link lub obraz do pobrania)
- Bez logowania — jednorazowa sesja

---

## 4. Schemat bazy danych

### `artists`

| Kolumna          | Typ                    | Opis                                  |
| ---------------- | ---------------------- | ------------------------------------- |
| `id`             | `uuid` PK              |                                       |
| `name`           | `text` NOT NULL        | Nazwa artysty                         |
| `slug`           | `text` UNIQUE NOT NULL | URL-friendly identifier               |
| `origin_country` | `text` nullable        | Kraj pochodzenia (ISO 3166-1 alpha-2) |
| `created_at`     | `timestamptz`          |                                       |

---

### `songs`

| Kolumna        | Typ                    | Opis                           |
| -------------- | ---------------------- | ------------------------------ |
| `id`           | `uuid` PK              |                                |
| `title`        | `text` NOT NULL        | Tytuł piosenki                 |
| `slug`         | `text` UNIQUE NOT NULL | URL-friendly identifier        |
| `artist_id`    | `uuid` FK → artists    |                                |
| `description`  | `text` nullable        | Opis/ciekawostki               |
| `release_date` | `date` nullable        | Data wydania                   |
| `cover_url`    | `text` nullable        | URL okładki (Supabase Storage) |
| `created_at`   | `timestamptz`          |                                |

---

### `charts`

| Kolumna        | Typ                    | Opis                                |
| -------------- | ---------------------- | ----------------------------------- |
| `id`           | `uuid` PK              |                                     |
| `country_code` | `text` NOT NULL        | ISO 3166-1 alpha-2 (np. `GB`, `PL`) |
| `country_name` | `text` NOT NULL        | Pełna nazwa kraju                   |
| `chart_name`   | `text` NOT NULL        | Np. `UK Singles Chart`              |
| `is_active`    | `boolean` default true | Czy lista jest aktywna              |

---

### `chart_entries` ⭐ (główna encja)

| Kolumna          | Typ                | Opis                                       |
| ---------------- | ------------------ | ------------------------------------------ |
| `id`             | `uuid` PK          |                                            |
| `song_id`        | `uuid` FK → songs  |                                            |
| `chart_id`       | `uuid` FK → charts |                                            |
| `position`       | `integer` NOT NULL | Pozycja na liście (1–100)                  |
| `chart_date`     | `date` NOT NULL    | Data wydania danej listy                   |
| `peak_position`  | `integer`          | Najwyższa pozycja osiągnięta przez tę datę |
| `weeks_on_chart` | `integer`          | Liczba tygodni na liście przez tę datę     |

**Indeksy:**

- `UNIQUE (song_id, chart_id, chart_date)` — jeden wpis na piosenkę na listę na tydzień
- `INDEX (chart_id, chart_date)` — szybkie ładowanie listy z danego tygodnia
- `INDEX (song_id, chart_id)` — szybki wykres historii piosenki

---

## 5. Strony i routing

```
/                          → Strona główna
/charts                    → Lista wszystkich list przebojów (V2+)
/charts/[country]          → Aktualna lista przebojów danego kraju
/songs/[slug]              → Historia piosenki + wykres
/artists/[slug]            → Artysta + jego piosenki na listach
/compare                   → Porównywarka (V2+)
/taste                     → AI Music Taste Analyzer (V3)
```

---

## 6. API Routes

```
GET  /api/songs                      → lista piosenek + search query param
GET  /api/songs/[slug]               → dane piosenki + chart_entries
GET  /api/songs/[slug]/chart         → dane do wykresu Recharts
GET  /api/artists/[slug]             → artysta + discography
GET  /api/charts/[country]           → aktualna lista (najnowszy chart_date)
GET  /api/charts/[country]/[date]    → lista z konkretnego tygodnia
POST /api/ai/taste                   → V3: analiza gustu (Server Action)
```

---

## 7. Wykres — specyfikacja

**Biblioteka:** Recharts (dostępna w shadcn/ui)

**Typ wykresu:** `LineChart`

**Oś X:** `chart_date` (tygodniowe interwały), format `MMM YYYY`

**Oś Y:** `position` — **odwrócona** (1 na górze, 100 na dole). Zakres: 1–40 (można przewijać).

**Linie:**

- V1: jedna linia = UK chart
- V2: każda linia = inny kraj, różne kolory, legenda

**Tooltip:** po najechaniu na punkt — data, pozycja, tygodnie na liście.

**Responsywność:** `ResponsiveContainer` — pełna szerokość, stała wysokość 320px.

---

## 8. Wymagania niefunkcjonalne

| Wymaganie                       | Cel                                                  |
| ------------------------------- | ---------------------------------------------------- |
| Czas do pierwszego bajtu (TTFB) | < 200ms (ISR + Vercel Edge)                          |
| Lighthouse Performance          | ≥ 90                                                 |
| Brak logowania                  | Wszystkie strony publicznie dostępne                 |
| SEO                             | Generowane meta tagi na stronach piosenek i artystów |
| Dostępność                      | WCAG 2.1 AA (shadcn/ui spełnia domyślnie)            |
| Mobile                          | Responsive — minimum 360px szerokości                |
| Type safety                     | Brak `any` w całym projekcie                         |

---

## 9. Stack techniczny — decyzje

| Technologia     | Rola                  | Uzasadnienie                                     |
| --------------- | --------------------- | ------------------------------------------------ |
| **Next.js 15**  | Frontend + Backend    | App Router, RSC, Server Actions, ISR             |
| **Supabase**    | Baza danych + Storage | Postgres, gotowe SDK, darmowy tier dla portfolio |
| **Drizzle ORM** | ORM + migracje        | Type-safe, szybkie zapytania, blisko SQL         |
| **shadcn/ui**   | Komponenty UI         | Recharts wbudowany, łatwy theming                |
| **Vercel**      | Deploy                | Natywna integracja z Next.js, ISR out-of-the-box |
| **TypeScript**  | Język                 | End-to-end type safety z Drizzle schema          |

---

## 10. Struktura projektu

```
charted-tracks/
├── app/
│   ├── (routes)/
│   │   ├── page.tsx                  ← strona główna
│   │   ├── charts/[country]/page.tsx
│   │   ├── songs/[slug]/page.tsx
│   │   ├── artists/[slug]/page.tsx
│   │   ├── compare/page.tsx          ← V2
│   │   └── taste/page.tsx            ← V3
│   ├── api/
│   │   ├── songs/route.ts
│   │   ├── songs/[slug]/route.ts
│   │   ├── charts/[country]/route.ts
│   │   └── ai/taste/route.ts         ← V3
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── charts/
│   │   ├── ChartLine.tsx             ← główny wykres
│   │   ├── ChartTooltip.tsx
│   │   └── ChartCompare.tsx          ← V2
│   ├── songs/
│   │   ├── SongCard.tsx
│   │   └── SongSearch.tsx
│   └── ui/                           ← shadcn/ui komponenty
├── db/
│   ├── schema.ts                     ← Drizzle schema
│   ├── index.ts                      ← klient Drizzle
│   └── migrations/
├── lib/
│   ├── queries/
│   │   ├── songs.ts                  ← zapytania do songs
│   │   ├── charts.ts                 ← zapytania do chart_entries
│   │   └── artists.ts
│   └── utils.ts
├── scripts/
│   └── seed.ts                       ← seed UK chart z CSV
└── types/
    └── index.ts                      ← typy współdzielone
```

---

## 11. Dane — źródło i seed

**V1 — UK Singles Chart:**

- Źródło: [Official UK Charts Company](https://www.officialcharts.com/) — dane historyczne dostępne publicznie jako CSV lub przez scraping
- Format importu: `CSV → pnpm db:seed`
- Zakres danych startowych: ostatnie 2 lata (wystarczy do demo portfolio)

**Komendy:**

```bash
pnpm db:generate    # generuje migracje z schema.ts
pnpm db:migrate     # aplikuje migracje na Supabase
pnpm db:seed        # wczytuje dane z /scripts/data/*.csv
pnpm db:studio      # Drizzle Studio (podgląd bazy)
```

---

## 12. Zmienne środowiskowe

```env
DATABASE_URL=                  # Supabase connection string (pooler)
NEXT_PUBLIC_SUPABASE_URL=      # publiczny URL Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY= # publiczny klucz anon
ANTHROPIC_API_KEY=             # tylko V3 — klucz Claude API
```

---

## 13. Metryki sukcesu (portfolio)

| Metryka                  | Cel                                       |
| ------------------------ | ----------------------------------------- |
| Lighthouse Performance   | ≥ 90                                      |
| Lighthouse Accessibility | ≥ 95                                      |
| Brak błędów TypeScript   | 0 błędów `tsc --noEmit`                   |
| Testy E2E                | ≥ 3 główne ścieżki (Playwright)           |
| README                   | Pełny opis z GIF demo i linkiem do Vercel |

---

## 14. Kolejność implementacji

```
[1] Inicjalizacja projektu (Next.js + Drizzle + Supabase)
[2] Schema bazy + migracje
[3] Seed script + dane UK chart
[4] API route: /api/songs/[slug]/chart
[5] Strona piosenki z wykresem (core feature)
[6] Strona główna + Top 10
[7] Strona artysty
[8] Wyszukiwarka
[9] Styling, responsywność, SEO meta tagi
[10] Deploy na Vercel
--- V2 ---
[11] Dodanie chartów innych krajów
[12] Strona /compare
[13] Aggregate stats
--- V3 ---
[14] Integracja Claude API
[15] Strona /taste
[16] Sharing feature
```
