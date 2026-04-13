import { eq, ilike, or, desc } from "drizzle-orm";
import { db } from "@/db";
import { songs, artists, chartEntries, charts } from "@/db/schema";

// ---------------------------------------------------------------------------
// Typy zwracane przez zapytania
// ---------------------------------------------------------------------------

export type SongWithArtist = NonNullable<Awaited<ReturnType<typeof getSongBySlug>>>;

export type SongSearchResult = Awaited<ReturnType<typeof searchSongs>>[number];

// ---------------------------------------------------------------------------
// Pełne dane piosenki — do strony /songs/[slug]
// Zawiera artystę i wszystkie wpisy na listach przebojów z info o liście
// ---------------------------------------------------------------------------

export async function getSongBySlug(slug: string) {
  return db.query.songs.findFirst({
    where: eq(songs.slug, slug),
    with: {
      artist: true,
      chartEntries: {
        with: { chart: true },
        orderBy: (entries, { asc }) => [asc(entries.chartDate)],
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Wyszukiwarka — full-text search po tytule i nazwie artysty
// Limit 20 wyników, posortowane alfabetycznie
// ---------------------------------------------------------------------------

export async function searchSongs(query: string, limit = 20) {
  const term = `%${query.trim()}%`;

  return db
    .select({
      id: songs.id,
      title: songs.title,
      slug: songs.slug,
      coverUrl: songs.coverUrl,
      artistName: artists.name,
      artistSlug: artists.slug,
    })
    .from(songs)
    .innerJoin(artists, eq(songs.artistId, artists.id))
    .where(or(ilike(songs.title, term), ilike(artists.name, term)))
    .limit(limit);
}

// ---------------------------------------------------------------------------
// Wszystkie piosenki artysty — do strony /artists/[slug]
// ---------------------------------------------------------------------------

export async function getSongsByArtistSlug(artistSlug: string) {
  return db
    .select({
      id: songs.id,
      title: songs.title,
      slug: songs.slug,
      coverUrl: songs.coverUrl,
      releaseDate: songs.releaseDate,
    })
    .from(songs)
    .innerJoin(artists, eq(songs.artistId, artists.id))
    .where(eq(artists.slug, artistSlug))
    .orderBy(desc(songs.releaseDate));
}
