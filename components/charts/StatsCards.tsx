import type { SongChartHistory } from "@/lib/queries/charts";

type Props = {
  history: SongChartHistory;
};

export function StatsCards({ history }: Props) {
  const debutFormatted = new Date(history.debutDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const stats = [
    {
      label: "Peak position",
      value: `#${history.peakPosition}`,
      sub: history.peakPosition === 1 ? "🏆 Number one!" : undefined,
    },
    {
      label: "Weeks on chart",
      value: history.totalWeeks.toString(),
      sub: "weeks",
    },
    {
      label: "Chart debut",
      value: debutFormatted,
      sub: history.chartName,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-border bg-card p-4"
        >
          <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
          <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
          {stat.sub && (
            <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
