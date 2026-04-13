/**
 * Seed script — UK Singles Chart
 *
 * Uruchomienie:
 *   pnpm db:seed
 *
 * Skrypt jest idempotentny — można go uruchamiać wielokrotnie.
 * Używa INSERT ... ON CONFLICT DO NOTHING dla artystów, piosenek i chartów.
 * Dla chart_entries używa ON CONFLICT DO UPDATE żeby zaktualizować
 * peak_position i weeks_on_chart jeśli dane się zmieniły.
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";

import { artists, songs, charts, chartEntries } from "../db/schema";
import type { NewArtist, NewSong, NewChartEntry } from "../db/schema";
import { parseCsv } from "./lib/csv";
import { slugify } from "./lib/slugify";

// ---------------------------------------------------------------------------
// połączenie z bazą
// ---------------------------------------------------------------------------

if (!process.env.DATABASE_URL) {
  throw new Error("Brak DATABASE_URL w zmiennych środowiskowych.");
}

const client = postgres(process.env.DATABASE_URL, { prepare: false });
const db = drizzle(client, { schema: { artists, songs, charts, chartEntries } });

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 Rozpoczynam seed UK Singles Chart...\n");

  const rows = parseCsv("scripts/data/uk-chart.csv");
  console.log(`📄 Wczytano ${rows.length} wierszy z CSV.\n`);

  // -------------------------------------------------------------------------
  // 1. Upsert chart: UK Singles Chart
  // -------------------------------------------------------------------------

  console.log("📊 Tworzę chart: UK Singles Chart...");

  const [ukChart] = await db
    .insert(charts)
    .values({
      countryCode: "GB",
      countryName: "United Kingdom",
      chartName: "UK Singles Chart",
      isActive: true,
    })
    .onConflictDoNothing()   // jeśli już istnieje — nic nie rób
    .returning();

  // jeśli onConflictDoNothing nic nie zwróciło, pobierz istniejący rekord
  const chart =
    ukChart ??
    (await db.query.charts.findFirst({
      where: eq(charts.countryCode, "GB"),
    }));

  if (!chart) throw new Error("Nie udało się utworzyć/znaleźć chartu GB.");
  console.log(`   ✅ Chart ID: ${chart.id}\n`);

  // -------------------------------------------------------------------------
  // 2. Zbierz unikalnych artystów z CSV i upsertuj
  // -------------------------------------------------------------------------

  const uniqueArtistNames = [...new Set(rows.map((r) => r.artist))];
  console.log(`👤 Znaleziono ${uniqueArtistNames.length} unikalnych artystów.`);

  const artistValues: NewArtist[] = uniqueArtistNames.map((name) => ({
    name,
    slug: slugify(name),
  }));

  await db.insert(artists).values(artistValues).onConflictDoNothing();

  // pobierz wszystkich artystów z bazy (potrzebujemy ID)
  const allArtists = await db.select().from(artists);
  const artistByName = new Map(allArtists.map((a) => [a.name, a]));
  console.log(`   ✅ Artyści gotowi.\n`);

  // -------------------------------------------------------------------------
  // 3. Zbierz unikalne piosenki (title + artist) i upsertuj
  // -------------------------------------------------------------------------

  const uniqueSongs = [
    ...new Map(rows.map((r) => [`${r.title}__${r.artist}`, r])).values(),
  ];
  console.log(`🎵 Znaleziono ${uniqueSongs.length} unikalnych piosenek.`);

  for (const row of uniqueSongs) {
    const artist = artistByName.get(row.artist);
    if (!artist) {
      console.warn(`⚠️  Nie znaleziono artysty: "${row.artist}", pomijam piosenkę.`);
      continue;
    }

    const songValue: NewSong = {
      title: row.title,
      slug: slugify(`${row.title} ${artist.name}`),
      artistId: artist.id,
    };

    await db.insert(songs).values(songValue).onConflictDoNothing();
  }

  // pobierz wszystkie piosenki (potrzebujemy ID)
  const allSongs = await db.select().from(songs);
  const songBySlug = new Map(allSongs.map((s) => [s.slug, s]));
  console.log(`   ✅ Piosenki gotowe.\n`);

  // -------------------------------------------------------------------------
  // 4. Wstaw chart_entries
  // -------------------------------------------------------------------------

  console.log(`📈 Wstawiam ${rows.length} wpisów do chart_entries...`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const artist = artistByName.get(row.artist);
    if (!artist) { skipped++; continue; }

    const slug = slugify(`${row.title} ${row.artist}`);
    const song = songBySlug.get(slug);
    if (!song) { skipped++; continue; }

    const entryValue: NewChartEntry = {
      songId: song.id,
      chartId: chart.id,
      position: parseInt(row.position, 10),
      chartDate: row.chart_date,
      peakPosition: parseInt(row.peak_position, 10),
      weeksOnChart: parseInt(row.weeks_on_chart, 10),
    };

    // sprawdź czy wpis już istnieje
    const existing = await db.query.chartEntries.findFirst({
      where: and(
        eq(chartEntries.songId, song.id),
        eq(chartEntries.chartId, chart.id),
        eq(chartEntries.chartDate, row.chart_date)
      ),
    });

    if (existing) {
      // aktualizuj tylko jeśli dane się zmieniły
      if (
        existing.position !== entryValue.position ||
        existing.peakPosition !== entryValue.peakPosition ||
        existing.weeksOnChart !== entryValue.weeksOnChart
      ) {
        await db
          .update(chartEntries)
          .set({
            position: entryValue.position,
            peakPosition: entryValue.peakPosition,
            weeksOnChart: entryValue.weeksOnChart,
          })
          .where(eq(chartEntries.id, existing.id));
        updated++;
      } else {
        skipped++;
      }
    } else {
      await db.insert(chartEntries).values(entryValue);
      inserted++;
    }
  }

  console.log(`   ✅ Wstawiono: ${inserted} | Zaktualizowano: ${updated} | Pominięto: ${skipped}\n`);

  // -------------------------------------------------------------------------
  // 5. Podsumowanie
  // -------------------------------------------------------------------------

  const [artistCount] = await db
    .select({ count: artists.id })
    .from(artists);

  const [songCount] = await db
    .select({ count: songs.id })
    .from(songs);

  const [entryCount] = await db
    .select({ count: chartEntries.id })
    .from(chartEntries);

  console.log("🎉 Seed zakończony!\n");
  console.log("📊 Stan bazy:");
  console.log(`   Artyści:       ${allArtists.length}`);
  console.log(`   Piosenki:      ${allSongs.length}`);
  console.log(`   Chart entries: ${rows.length} wierszy przetworzonych`);

  await client.end();
}

main().catch((err) => {
  console.error("❌ Seed zakończony błędem:", err);
  process.exit(1);
});
