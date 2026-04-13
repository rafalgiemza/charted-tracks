import { eq, min, max, count, countDistinct, desc, asc, inArray, and } from "drizzle-orm";
import { db } from "@/db";
import { artists, songs, chartEntries, charts } from "@/db/schema";
import type { SparkPoint } from "./home";

// ---------------------------------------------------------------------------
// Typy
// ---------------------------------------------------------------------------

export type DiscographySong = {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  releaseDate: string | null;
  peakPosition: number;
  totalWeeks: number;
  chartCount: number;
  debutDate: string;
  sparkData: SparkPoint[];
};

export type ArtistStats = {
  totalSongs: number;
  bestPeak: number;
  totalWeeksOnChart: number;
  countriesReached: number;
};

export type ArtistPageData = {
  id: string;
  name: string;
  slug: string;
  originCountry: string | null;
  stats: ArtistStats;
  discography: DiscographySong[];
};

// ---------------------------------------------------------------------------
// Główna funkcja — 3 zapytania, zero N+1
// ---------------------------------------------------------------------------

export async function getArtistPageData(slug: string): Promise<ArtistPageData | null> {
  const artist = await db.query.artists.findFirst({
    where: eq(artists.slug, slug),
  });
  if (!artist) return null;

  const songStats = await db
    .select({
      songId:       songs.id,
      songTitle:    songs.title,
      songSlug:     songs.slug,
      coverUrl:     songs.coverUrl,
      releaseDate:  songs.releaseDate,
      peakPosition: min(chartEntries.position),
      totalWeeks:   max(chartEntries.weeksOnChart),
      chartCount:   countDistinct(chartEntries.chartId),
      debutDate:    min(chartEntries.chartDate),
    })
    .from(songs)
    .innerJoin(chartEntries, eq(songs.id, chartEntries.songId))
    .where(eq(songs.artistId, artist.id))
    .groupBy(songs.id, songs.title, songs.slug, songs.coverUrl, songs.releaseDate)
    .orderBy(desc(min(chartEntries.chartDate)));

  if (songStats.length === 0) {
    return {
      id: artist.id, name: artist.name, slug: artist.slug,
      originCountry: artist.originCountry,
      stats: { totalSongs: 0, bestPeak: 0, totalWeeksOnChart: 0, countriesReached: 0 },
      discography: [],
    };
  }

  const songIds = songStats.map((s) => s.songId);

  const recentDates = await db
    .selectDistinct({ chartDate: chartEntries.chartDate })
    .from(chartEntries)
    .innerJoin(charts, eq(chartEntries.chartId, charts.id))
    .where(eq(charts.countryCode, "GB"))
    .orderBy(desc(chartEntries.chartDate))
    .limit(8);

  const sparkDates = recentDates.map((r) => r.chartDate);

  const sparkRows = sparkDates.length > 0
    ? await db
        .select({ songId: chartEntries.songId, chartDate: chartEntries.chartDate, position: chartEntries.position })
        .from(chartEntries)
        .innerJoin(charts, eq(chartEntries.chartId, charts.id))
        .where(
          and(
            eq(charts.countryCode, "GB"),
            inArray(chartEntries.songId, songIds),
            inArray(chartEntries.chartDate, sparkDates)
          )
        )
        .orderBy(asc(chartEntries.chartDate))
    : [];

  const sparkMap = new Map<string, SparkPoint[]>();
  for (const row of sparkRows) {
    const arr = sparkMap.get(row.songId) ?? [];
    arr.push({ date: row.chartDate, position: row.position });
    sparkMap.set(row.songId, arr);
  }

  const peakValues  = songStats.map((s) => s.peakPosition ?? 999);
  const weeksValues = songStats.map((s) => s.totalWeeks ?? 0);
  const chartCounts = songStats.map((s) => s.chartCount ?? 0);

  const stats: ArtistStats = {
    totalSongs:         songStats.length,
    bestPeak:           Math.min(...peakValues),
    totalWeeksOnChart:  weeksValues.reduce((a, b) => a + b, 0),
    countriesReached:   Math.max(...chartCounts),
  };

  const discography: DiscographySong[] = songStats.map((s) => ({
    id:           s.songId,
    title:        s.songTitle,
    slug:         s.songSlug,
    coverUrl:     s.coverUrl,
    releaseDate:  s.releaseDate,
    peakPosition: s.peakPosition ?? 999,
    totalWeeks:   s.totalWeeks ?? 0,
    chartCount:   s.chartCount ?? 0,
    debutDate:    s.debutDate ?? "",
    sparkData:    sparkMap.get(s.songId) ?? [],
  }));

  return {
    id: artist.id, name: artist.name, slug: artist.slug,
    originCountry: artist.originCountry,
    stats, discography,
  };
}

export async function getArtistBySlug(slug: string) {
  return db.query.artists.findFirst({ where: eq(artists.slug, slug) });
}
