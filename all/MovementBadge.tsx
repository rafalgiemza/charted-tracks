import type { MovementType } from "@/lib/queries/home";
import { cn } from "@/lib/utils";

type Props = {
  movement: MovementType;
  delta: number;
};

const config: Record<
  MovementType,
  { label: (delta: number) => string; className: string }
> = {
  up: {
    label: (d) => `▲${d}`,
    className: "text-emerald-600 dark:text-emerald-400",
  },
  down: {
    label: (d) => `▼${d}`,
    className: "text-rose-500 dark:text-rose-400",
  },
  same: {
    label: () => "—",
    className: "text-muted-foreground",
  },
  new: {
    label: () => "NEW",
    className:
      "text-[10px] font-bold tracking-wide bg-primary text-primary-foreground rounded px-1 py-0.5",
  },
  reentry: {
    label: () => "RE",
    className:
      "text-[10px] font-bold tracking-wide bg-amber-500 text-white rounded px-1 py-0.5",
  },
};

export function MovementBadge({ movement, delta }: Props) {
  const { label, className } = config[movement];

  return (
    <span className={cn("text-xs font-semibold tabular-nums", className)}>
      {label(delta)}
    </span>
  );
}
