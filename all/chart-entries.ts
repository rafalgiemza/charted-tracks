import { pgTable, integer, date, timestamp, uuid, uniqueIndex, index } from "drizzle-orm/pg-core";
import { songs } from "./songs";
import { charts } from "./charts";

export const chartEntries = pgTable(
  "chart_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    songId: uuid("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    chartId: uuid("chart_id")
      .notNull()
      .references(() => charts.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),          // 1–100
    chartDate: date("chart_date").notNull(),           // data wydania listy (zazwyczaj piątek)
    peakPosition: integer("peak_position").notNull(),  // najlepsza pozycja osiągnięta do tej daty
    weeksOnChart: integer("weeks_on_chart").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // jeden wpis na piosenkę per lista per tydzień
    uniqueIndex("chart_entries_song_chart_date_uidx").on(
      table.songId,
      table.chartId,
      table.chartDate
    ),
    // szybkie ładowanie całej listy z danego tygodnia
    index("chart_entries_chart_date_idx").on(table.chartId, table.chartDate),
    // szybki wykres historii piosenki na konkretnej liście
    index("chart_entries_song_chart_idx").on(table.songId, table.chartId),
  ]
);

export type ChartEntry = typeof chartEntries.$inferSelect;
export type NewChartEntry = typeof chartEntries.$inferInsert;
