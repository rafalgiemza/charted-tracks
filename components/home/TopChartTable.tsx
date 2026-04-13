import type { HomepageData } from "@/lib/queries/home";
import { TopChartRow } from "./TopChartRow";

type Props = {
  data: HomepageData;
};

export function TopChartTable({ data }: Props) {
  const weekFormatted = new Date(data.chartDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section>
      {/* Nagłówek sekcji */}
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold">{data.chartName}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Week of {weekFormatted}
          </p>
        </div>

        {/* Kolumny — wyrównanie nagłówków z wierszami */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground uppercase tracking-wide pr-1">
          <span className="w-7" />
          <span className="w-9" />
          <span className="w-11" />
          <span className="flex-1" />
          <span className="w-14 text-right">Peak / Wk</span>
          <span className="hidden md:block w-20 text-right">Last 8w</span>
        </div>
      </div>

      {/* Wiersze */}
      <div className="flex flex-col gap-0.5">
        {data.entries.map((entry) => (
          <TopChartRow key={entry.song.id} entry={entry} rank={entry.position} />
        ))}
      </div>
    </section>
  );
}
