import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { getSongBySlug } from "@/lib/queries/songs";
import { getSongChartHistory } from "@/lib/queries/charts";
import { ChartLine } from "@/components/charts/ChartLine";
import { StatsCards } from "@/components/charts/StatsCards";

// ---------------------------------------------------------------------------
// ISR — odświeżaj stronę raz na dobę
// ---------------------------------------------------------------------------
export const revalidate = 86400;

// ---------------------------------------------------------------------------
// Dynamiczne meta tagi SEO
// ---------------------------------------------------------------------------
type Params = { slug: string };

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { slug } = await params;
  const song = await getSongBySlug(slug);
  if (!song) return { title: "Song not found" };

  return {
    title: `${song.title} – ${song.artist.name} | ChartPulse`,
    description: `See how "${song.title}" by ${song.artist.name} performed on the charts. Peak position, weeks on chart and full chart history.`,
    openGraph: {
      title: `${song.title} – ${song.artist.name}`,
      description: `Full chart history for ${song.title}`,
      ...(song.coverUrl && { images: [song.coverUrl] }),
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function SongPage(
  { params }: { params: Promise<Params> }
) {
  const { slug } = await params;

  const song = await getSongBySlug(slug);
  if (!song) notFound();

  const histories = await getSongChartHistory(song.id);

  const primaryHistory = histories[0] ?? null;

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/artists/${song.artist.slug}`}
          className="hover:text-foreground transition-colors"
        >
          {song.artist.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{song.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        {song.coverUrl ? (
          <img
            src={song.coverUrl}
            alt={`${song.title} cover`}
            className="h-24 w-24 rounded-md object-cover shrink-0 shadow"
          />
        ) : (
          <div className="h-24 w-24 rounded-md bg-muted shrink-0 flex items-center justify-center text-3xl">
            🎵
          </div>
        )}

        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight truncate">{song.title}</h1>
          <Link
            href={`/artists/${song.artist.slug}`}
            className="text-muted-foreground hover:text-foreground transition-colors mt-1 inline-block"
          >
            {song.artist.name}
          </Link>
          {song.releaseDate && (
            <p className="text-sm text-muted-foreground mt-1">
              Released{" "}
              {new Date(song.releaseDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>

      {/* Stats + Chart */}
      {primaryHistory ? (
        <div className="space-y-6">
          <StatsCards history={primaryHistory} />

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm">Chart position over time</h2>
              <div className="flex gap-2">
                {histories.map((h) => (
                  <span
                    key={h.chartId}
                    className="text-xs text-muted-foreground flex items-center gap-1"
                  >
                    {countryCodeToFlag(h.countryCode)} {h.chartName}
                  </span>
                ))}
              </div>
            </div>

            <ChartLine histories={histories} />

            <p className="text-xs text-muted-foreground text-center mt-3">
              Y-axis: chart position (lower = better). Gaps indicate weeks off chart.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          No chart data available for this song yet.
        </div>
      )}

      {/* Description */}
      {song.description && (
        <section className="mt-8">
          <h2 className="font-semibold mb-2">About</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {song.description}
          </p>
        </section>
      )}

    </main>
  );
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}
