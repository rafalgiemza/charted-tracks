import Link from "next/link";
import type { DiscographySong } from "@/lib/queries/artists";
import { SparkLine } from "@/components/charts/SparkLine";
import { cn } from "@/lib/utils";

type Props = {
  song: DiscographySong;
  index: number;
};

export function DiscographyRow({ song, index }: Props) {
  const debutFormatted = song.debutDate
    ? new Date(song.debutDate).toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
      })
    : null;

  const isNumberOne = song.peakPosition === 1;

  return (
    <Link
      href={`/songs/${song.slug}`}
      className="group flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/60 transition-colors"
    >
      {/* Index */}
      <span className="w-6 text-right text-sm text-muted-foreground tabular-nums shrink-0">
        {index + 1}
      </span>

      {/* Okładka */}
      <div className="h-11 w-11 shrink-0 rounded overflow-hidden bg-muted">
        {song.coverUrl ? (
          <img
            src={song.coverUrl}
            alt={song.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-lg">
            🎵
          </div>
        )}
      </div>

      {/* Tytuł + data debiutu */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
          {song.title}
        </p>
        {debutFormatted && (
          <p className="text-xs text-muted-foreground">
            Chart debut: {debutFormatted}
          </p>
        )}
      </div>

      {/* Peak badge */}
      <div
        className={cn(
          "hidden sm:flex items-center justify-center h-8 w-10 rounded-md text-xs font-bold tabular-nums shrink-0",
          isNumberOne
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            : "bg-muted text-muted-foreground"
        )}
        title="Peak position"
      >
        #{song.peakPosition}
      </div>

      {/* Weeks */}
      <div
        className="hidden sm:block w-12 text-right text-xs text-muted-foreground shrink-0 tabular-nums"
        title="Weeks on chart"
      >
        {song.totalWeeks}w
      </div>

      {/* Sparkline */}
      <div className="hidden md:block">
        <SparkLine data={song.sparkData} />
      </div>
    </Link>
  );
}
