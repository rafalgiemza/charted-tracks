"use client";

import type { TooltipProps } from "recharts";
import type { ChartDataPoint } from "@/lib/queries/charts";

type Props = TooltipProps<number, string> & {
  countryCode?: string;
};

export function ChartTooltip({ active, payload, label, countryCode }: Props) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload as ChartDataPoint;

  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-md text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>

      <div className="flex flex-col gap-0.5 text-muted-foreground">
        <span>
          Position:{" "}
          <span className="font-medium text-foreground">#{point.position}</span>
        </span>
        <span>
          Peak:{" "}
          <span className="font-medium text-foreground">#{point.peakPosition}</span>
        </span>
        <span>
          Weeks on chart:{" "}
          <span className="font-medium text-foreground">{point.weeksOnChart}</span>
        </span>
        {countryCode && (
          <span className="mt-1 text-xs">
            {countryCodeToFlag(countryCode)} {countryCode}
          </span>
        )}
      </div>
    </div>
  );
}

function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}
