import { pgTable, text, boolean, timestamp, uuid } from "drizzle-orm/pg-core";

export const charts = pgTable("charts", {
  id: uuid("id").primaryKey().defaultRandom(),
  countryCode: text("country_code").notNull(),   // ISO 3166-1 alpha-2, np. "GB"
  countryName: text("country_name").notNull(),   // np. "United Kingdom"
  chartName: text("chart_name").notNull(),       // np. "UK Singles Chart"
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Chart = typeof charts.$inferSelect;
export type NewChart = typeof charts.$inferInsert;
