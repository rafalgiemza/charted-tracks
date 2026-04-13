import Link from "next/link";
import type { TopChartEntry } from "@/lib/queries/home";
import { MovementBadge } from "./MovementBadge";
import { SparkLine } from "@/components/charts/SparkLine";
import { cn } from "@/lib/utils";

type Props = {
  entry: TopChartEntry;
  rank: number;
};

export function TopChartRow({ entry, rank }: Props) {
  const isTopThree = rank <= 3;

  return (
    <Link
      href={`/songs/${entry.song.slug}`}
      className={cn(
        "group flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
        "hover:bg-muted/60",
        isTopThree && "bg-muted/30"
      )}
    >
      {/* Pozycja */}
      <span
        className={cn(
          "w-7 text-center font-bold tabular-nums shrink-0",
          rank === 1 && "text-amber-500 text-lg",
          rank === 2 && "text-slate-400 text-base",
          rank === 3 && "text-amber-700 dark:text-amber-600 text-base",
          rank > 3 && "text-muted-foreground text-sm"
        )}
      >
        {rank}
      </span>

      {/* Ruch */}
      <div className="w-9 flex justify-center shrink-0">
        <MovementBadge movement={entry.movement} delta={entry.movementDelta} />
      </div>

      {/* Okładka */}
      <div className="h-11 w-11 shrink-0 rounded overflow-hidden bg-muted">
        {entry.song.coverUrl ? (
          <img
            src={entry.song.coverUrl}
            alt={entry.song.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-lg">
            🎵
          </div>
        )}
      </div>

      {/* Tytuł + artysta */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
          {entry.song.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {entry.artist.name}
        </p>
      </div>

      {/* Stats — ukryte na mobile */}
      <div className="hidden sm:flex flex-col items-end shrink-0 gap-0.5 text-xs text-muted-foreground tabular-nums">
        <span title="Peak position">
          Peak{" "}
          <span className="font-medium text-foreground">
            #{entry.peakPosition}
          </span>
        </span>
        <span title="Weeks on chart">
          {entry.weeksOnChart}w
        </span>
      </div>

      {/* Sparkline — ukryta na mobile */}
      <div className="hidden md:block">
        <SparkLine data={entry.sparkData} />
      </div>
    </Link>
  );
}
