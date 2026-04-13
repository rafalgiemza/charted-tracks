import Link from "next/link";
import type { Metadata } from "next";
import { getHomepageData } from "@/lib/queries/home";
import { TopChartTable } from "@/components/home/TopChartTable";
import { SparkLine } from "@/components/charts/SparkLine";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "ChartPulse — Music Chart History",
  description:
    "Track how your favourite songs performed on music charts around the world. UK Singles Chart, chart history, peak positions and more.",
};

export default async function HomePage() {
  const data = await getHomepageData("GB", 10);

  if (!data) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted-foreground">No chart data available yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Run <code className="bg-muted px-1 rounded">pnpm db:seed</code> to load data.
        </p>
      </main>
    );
  }

  const numberOne = data.entries[0];

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10 space-y-10">

      {/* ── Hero: #1 tej tygodnia ────────────────────────────────────────── */}
      <section>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-medium">
          🇬🇧 UK Singles Chart · This Week&apos;s #1
        </p>

        <Link
          href={`/songs/${numberOne.song.slug}`}
          className="group flex items-center gap-5 rounded-xl border border-border bg-card p-5 shadow-sm
                     hover:border-primary/40 hover:shadow-md transition-all"
        >
          {/* Okładka */}
          <div className="h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-muted shadow">
            {numberOne.song.coverUrl ? (
              <img
                src={numberOne.song.coverUrl}
                alt={numberOne.song.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-4xl">
                🥇
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold tracking-tight truncate group-hover:text-primary transition-colors">
              {numberOne.song.title}
            </p>
            <p className="text-muted-foreground mt-0.5">{numberOne.artist.name}</p>

            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              <span>
                Peak{" "}
                <span className="font-semibold text-foreground">
                  #{numberOne.peakPosition}
                </span>
              </span>
              <span>
                {numberOne.weeksOnChart}{" "}
                {numberOne.weeksOnChart === 1 ? "week" : "weeks"} on chart
              </span>
            </div>
          </div>

          {/* Sparkline #1 */}
          <div className="hidden sm:block shrink-0">
            <p className="text-[10px] text-muted-foreground text-center mb-1">
              Last 8 weeks
            </p>
            <SparkLine
              data={numberOne.sparkData}
              color="hsl(38, 92%, 50%)"
            />
          </div>
        </Link>
      </section>

      {/* ── Top 10 ──────────────────────────────────────────────────────── */}
      <TopChartTable data={data} />

      {/* ── Footer CTA ──────────────────────────────────────────────────── */}
      <div className="text-center pt-2">
        <Link
          href="/charts/gb"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
        >
          View full UK Singles Chart →
        </Link>
      </div>

    </main>
  );
}
