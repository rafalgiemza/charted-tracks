"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { SongChartHistory } from "@/lib/queries/charts";
import { ChartTooltip } from "./ChartTooltip";

// Jeden kolor per kraj — do V2 łatwo rozszerzyć
const CHART_COLORS: Record<string, string> = {
  GB: "hsl(221, 83%, 53%)",  // niebieski
  US: "hsl(0, 72%, 51%)",    // czerwony
  PL: "hsl(142, 71%, 45%)",  // zielony
  DE: "hsl(38, 92%, 50%)",   // żółty
  FR: "hsl(271, 81%, 56%)",  // fioletowy
};

const DEFAULT_COLOR = "hsl(221, 83%, 53%)";

type Props = {
  histories: SongChartHistory[];
  /** Ile pozycji pokazać na osi Y (default: 40) */
  yDomain?: number;
};

export function ChartLine({ histories, yDomain = 40 }: Props) {
  if (histories.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
        Brak danych do wyświetlenia
      </div>
    );
  }

  // złącz daty ze wszystkich historii w jeden zbiór (oś X)
  const allDates = [
    ...new Set(histories.flatMap((h) => h.data.map((d) => d.date))),
  ].sort();

  // zbuduj wspólną tablicę punktów z kluczami per kraj
  // { date, dateLabel, GB: 3, US: 5, ... }
  type MergedPoint = { date: string; dateLabel: string } & Record<string, number>;

  const merged: MergedPoint[] = allDates.map((date) => {
    const base: MergedPoint = {
      date,
      dateLabel: histories[0].data.find((d) => d.date === date)?.dateLabel ?? date,
    };
    for (const history of histories) {
      const point = history.data.find((d) => d.date === date);
      if (point) base[history.countryCode] = point.position;
    }
    return base;
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart
        data={merged}
        margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          opacity={0.5}
        />

        <XAxis
          dataKey="dateLabel"
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />

        {/* Oś Y odwrócona: 1 na górze = najlepsza pozycja */}
        <YAxis
          reversed
          domain={[1, yDomain]}
          tickCount={8}
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `#${v}`}
        />

        <Tooltip
          content={(props) => (
            <ChartTooltip
              {...props}
              countryCode={histories.length === 1 ? histories[0].countryCode : undefined}
            />
          )}
          cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
        />

        {/* Linia #1 — Top position reference */}
        <ReferenceLine
          y={1}
          stroke="hsl(var(--muted-foreground))"
          strokeDasharray="4 4"
          opacity={0.3}
          label={{ value: "#1", position: "right", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
        />

        {histories.map((history) => (
          <Line
            key={history.chartId}
            type="monotone"
            dataKey={history.countryCode}
            name={history.chartName}
            stroke={CHART_COLORS[history.countryCode] ?? DEFAULT_COLOR}
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            connectNulls={false}   // przerwa w linii gdy piosenka wypadła z listy
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
