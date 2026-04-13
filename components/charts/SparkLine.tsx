"use client";

import { LineChart, Line, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import type { SparkPoint } from "@/lib/queries/home";

type Props = {
  data: SparkPoint[];
  color?: string;
};

export function SparkLine({ data, color = "hsl(221, 83%, 53%)" }: Props) {
  if (data.length < 2) {
    return <div className="w-20 h-9" />;
  }

  // oś Y odwrócona — #1 na górze
  const positions = data.map((d) => d.position);
  const yMin = Math.min(...positions);
  const yMax = Math.max(...positions);

  return (
    <div className="w-20 h-9 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <YAxis
            domain={[yMax + 2, Math.max(1, yMin - 2)]}
            hide
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as SparkPoint;
              return (
                <div className="rounded border border-border bg-background px-1.5 py-1 text-[11px] shadow-sm">
                  #{point.position}
                </div>
              );
            }}
            cursor={false}
          />
          <Line
            type="monotone"
            dataKey="position"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 2.5, strokeWidth: 0 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
