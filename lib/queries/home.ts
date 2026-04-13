import { eq, and, inArray, asc, desc, max, sql } from "drizzle-orm";
import { db } from "@/db";
import { charts, chartEntries, songs, artists } from "@/db/schema";

// ---------------------------------------------------------------------------
// Typy
// ---------------------------------------------------------------------------

export type MovementType = "up" | "down" | "same" | "new" | "reentry";

export type SparkPoint = {
  date: string;
  position: number;
};

export type TopChartEntry = {
  position: number;
  previousPosition: number | null;
  movement: MovementType;
  movementDelta: number;            // ile pozycji w górę/dół
  peakPosition: number;
  weeksOnChart: number;
  chartDate: string;
  song: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
  };
  artist: {
    name: string;
    slug: string;
  };
  sparkData: SparkPoint[];          // ostatnie 8 tygodni do mini wykresu
};

export type HomepageData = {
  countryCode: string;
  countryName: string;
  chartName: string;
  chartDate: string;                // data najnowszego tygodnia
  entries: TopChartEntry[];
};

// ---------------------------------------------------------------------------
// Główna funkcja — 3 zapytania, zero N+1
// ---------------------------------------------------------------------------

export async function getHomepageData(
  countryCode = "GB",
  limit = 10
): Promise<HomepageData | null> {

  // ── 1. Znajdź dwie ostatnie daty listy (aktualny + poprzedni tydzień) ────

  const recentDates = await db
    .selectDistinct({ chartDate: chartEntries.chartDate })
    .from(chartEntries)
    .innerJoin(charts, eq(chartEntries.chartId, charts.id))
    .where(eq(charts.countryCode, countryCode))
    .orderBy(desc(chartEntries.chartDate))
    .limit(9);                      // 9 tygodni = aktualny + 8 do sparkline

  if (recentDates.length === 0) return null;

  const [currentDate, previousDate] = [
    recentDates[0].chartDate,
    recentDates[1]?.chartDate ?? null,
  ];
  const sparkDates = recentDates.map((r) => r.chartDate);

  // ── 2. Pobierz chart meta ────────────────────────────────────────────────

  const chart = await db.query.charts.findFirst({
    where: eq(charts.countryCode, countryCode),
  });

  if (!chart) return null;

  // ── 3. Top N z aktualnego tygodnia + dane poprzedniego tygodnia ─────────

  const currentEntries = await db
    .select({
      position: chartEntries.position,
      peakPosition: chartEntries.peakPosition,
      weeksOnChart: chartEntries.weeksOnChart,
      songId: songs.id,
      songTitle: songs.title,
      songSlug: songs.slug,
      coverUrl: songs.coverUrl,
      artistName: artists.name,
      artistSlug: artists.slug,
    })
    .from(chartEntries)
    .innerJoin(charts, eq(chartEntries.chartId, charts.id))
    .innerJoin(songs, eq(chartEntries.songId, songs.id))
    .innerJoin(artists, eq(songs.artistId, artists.id))
    .where(
      and(
        eq(charts.countryCode, countryCode),
        eq(chartEntries.chartDate, currentDate)
      )
    )
    .orderBy(asc(chartEntries.position))
    .limit(limit);

  if (currentEntries.length === 0) return null;

  const songIds = currentEntries.map((e) => e.songId);

  // ── 4. Poprzedni tydzień dla tych samych piosenek (ruch na liście) ───────

  const prevMap = new Map<string, number>();

  if (previousDate) {
    const prevEntries = await db
      .select({
        songId: chartEntries.songId,
        position: chartEntries.position,
      })
      .from(chartEntries)
      .innerJoin(charts, eq(chartEntries.chartId, charts.id))
      .where(
        and(
          eq(charts.countryCode, countryCode),
          eq(chartEntries.chartDate, previousDate),
          inArray(chartEntries.songId, songIds)
        )
      );

    for (const e of prevEntries) prevMap.set(e.songId, e.position);
  }

  // ── 5. Historia ostatnich 8 tygodni dla sparkline (jedno zapytanie) ──────

  const historyRows = await db
    .select({
      songId: chartEntries.songId,
      chartDate: chartEntries.chartDate,
      position: chartEntries.position,
    })
    .from(chartEntries)
    .innerJoin(charts, eq(chartEntries.chartId, charts.id))
    .where(
      and(
        eq(charts.countryCode, countryCode),
        inArray(chartEntries.songId, songIds),
        inArray(chartEntries.chartDate, sparkDates)
      )
    )
    .orderBy(asc(chartEntries.chartDate));

  const sparkMap = new Map<string, SparkPoint[]>();
  for (const row of historyRows) {
    const arr = sparkMap.get(row.songId) ?? [];
    arr.push({ date: row.chartDate, position: row.position });
    sparkMap.set(row.songId, arr);
  }

  // ── 6. Złóż finalną strukturę ────────────────────────────────────────────

  const entries: TopChartEntry[] = currentEntries.map((e) => {
    const previousPosition = prevMap.get(e.songId) ?? null;
    const { movement, delta } = calcMovement(
      e.position,
      previousPosition,
      e.weeksOnChart
    );

    return {
      position: e.position,
      previousPosition,
      movement,
      movementDelta: delta,
      peakPosition: e.peakPosition,
      weeksOnChart: e.weeksOnChart,
      chartDate: currentDate,
      song: {
        id: e.songId,
        title: e.songTitle,
        slug: e.songSlug,
        coverUrl: e.coverUrl,
      },
      artist: {
        name: e.artistName,
        slug: e.artistSlug,
      },
      sparkData: sparkMap.get(e.songId) ?? [],
    };
  });

  return {
    countryCode,
    countryName: chart.countryName,
    chartName: chart.chartName,
    chartDate: currentDate,
    entries,
  };
}

// ---------------------------------------------------------------------------
// helper — oblicz ruch na liście
// ---------------------------------------------------------------------------

function calcMovement(
  current: number,
  previous: number | null,
  weeksOnChart: number
): { movement: MovementType; delta: number } {
  if (previous === null) {
    return {
      movement: weeksOnChart <= 1 ? "new" : "reentry",
      delta: 0,
    };
  }
  const delta = previous - current;   // dodatni = ruch w górę (poprawa pozycji)
  if (delta > 0) return { movement: "up", delta };
  if (delta < 0) return { movement: "down", delta: Math.abs(delta) };
  return { movement: "same", delta: 0 };
}
