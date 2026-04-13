import { eq, and, desc, asc, max, min } from "drizzle-orm";
import { db } from "@/db";
import { charts, chartEntries, songs, artists } from "@/db/schema";

// ---------------------------------------------------------------------------
// Typy
// ---------------------------------------------------------------------------

/** Jeden punkt na wykresie — jeden tydzień na liście */
export type ChartDataPoint = {
  date: string;          // "YYYY-MM-DD" — dla Recharts
  dateLabel: string;     // "5 Jan" — wyświetlane na osi X
  position: number;      // 1–100
  peakPosition: number;
  weeksOnChart: number;
};

/** Historia piosenki na jednej liście — payload do wykresu */
export type SongChartHistory = {
  chartId: string;
  chartName: string;
  countryCode: string;
  countryName: string;
  data: ChartDataPoint[];
  peakPosition: number;   // minimum position (najlepszy wynik) dla tej listy
  totalWeeks: number;     // łączna liczba tygodni na liście
  debutDate: string;      // pierwsza data pojawienia się
};

// ---------------------------------------------------------------------------
// Historia piosenki na listach — do wykresu na /songs/[slug]
// Zwraca tablicę (jeden element = jedna lista/kraj) dla łatwego
// rozszerzenia do V2 (kilka krajów na jednym wykresie)
// ---------------------------------------------------------------------------

export async function getSongChartHistory(songId: string): Promise<SongChartHistory[]> {
  const entries = await db
    .select({
      chartId: chartEntries.chartId,
      chartName: charts.chartName,
      countryCode: charts.countryCode,
      countryName: charts.countryName,
      position: chartEntries.position,
      chartDate: chartEntries.chartDate,
      peakPosition: chartEntries.peakPosition,
      weeksOnChart: chartEntries.weeksOnChart,
    })
    .from(chartEntries)
    .innerJoin(charts, eq(chartEntries.chartId, charts.id))
    .where(eq(chartEntries.songId, songId))
    .orderBy(asc(chartEntries.chartDate));

  if (entries.length === 0) return [];

  // grupuj po chartId (V1: jeden chart, V2: wiele)
  const grouped = new Map<string, typeof entries>();
  for (const entry of entries) {
    const group = grouped.get(entry.chartId) ?? [];
    group.push(entry);
    grouped.set(entry.chartId, group);
  }

  return Array.from(grouped.entries()).map(([chartId, chartData]) => {
    const { chartName, countryCode, countryName } = chartData[0];

    const data: ChartDataPoint[] = chartData.map((e) => ({
      date: e.chartDate,
      dateLabel: formatDateLabel(e.chartDate),
      position: e.position,
      peakPosition: e.peakPosition,
      weeksOnChart: e.weeksOnChart,
    }));

    const peakPosition = Math.min(...chartData.map((e) => e.position));
    const totalWeeks = Math.max(...chartData.map((e) => e.weeksOnChart));
    const debutDate = chartData[0].chartDate;

    return {
      chartId,
      chartName,
      countryCode,
      countryName,
      data,
      peakPosition,
      totalWeeks,
      debutDate,
    };
  });
}

// ---------------------------------------------------------------------------
// Aktualna lista (najnowszy tydzień) danego kraju — do strony /charts/[country]
// i do Top 10 na stronie głównej
// ---------------------------------------------------------------------------

export async function getLatestChart(countryCode: string, limit = 10) {
  // znajdź najnowszą datę dla tego kraju
  const [latest] = await db
    .select({ maxDate: max(chartEntries.chartDate) })
    .from(chartEntries)
    .innerJoin(charts, eq(chartEntries.chartId, charts.id))
    .where(eq(charts.countryCode, countryCode));

  if (!latest?.maxDate) return [];

  return db
    .select({
      position: chartEntries.position,
      peakPosition: chartEntries.peakPosition,
      weeksOnChart: chartEntries.weeksOnChart,
      chartDate: chartEntries.chartDate,
      songId: songs.id,
      songTitle: songs.title,
      songSlug: songs.slug,
      coverUrl: songs.coverUrl,
      artistId: artists.id,
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
        eq(chartEntries.chartDate, latest.maxDate)
      )
    )
    .orderBy(asc(chartEntries.position))
    .limit(limit);
}

export type LatestChartEntry = Awaited<ReturnType<typeof getLatestChart>>[number];

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
