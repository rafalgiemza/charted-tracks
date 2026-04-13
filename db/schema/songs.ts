import { pgTable, text, date, timestamp, uuid } from "drizzle-orm/pg-core";
import { artists } from "./artists";

export const songs = pgTable("songs", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "restrict" }),
  description: text("description"),
  releaseDate: date("release_date"),
  coverUrl: text("cover_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Song = typeof songs.$inferSelect;
export type NewSong = typeof songs.$inferInsert;
