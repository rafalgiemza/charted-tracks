/**
 * Wszystkie relacje Drizzle są zdefiniowane tutaj.
 *
 * Dlaczego osobny plik?
 * Relacje odwołują się do siebie nawzajem (artists ↔ songs ↔ chartEntries ↔ charts),
 * co tworzy circular imports gdy są w plikach tabel.
 * Wydzielenie do jednego pliku eliminuje ten problem.
 */

import { relations } from "drizzle-orm";
import { artists } from "./artists";
import { songs } from "./songs";
import { charts } from "./charts";
import { chartEntries } from "./chart-entries";

export const artistsRelations = relations(artists, ({ many }) => ({
  songs: many(songs),
}));

export const songsRelations = relations(songs, ({ one, many }) => ({
  artist: one(artists, {
    fields: [songs.artistId],
    references: [artists.id],
  }),
  chartEntries: many(chartEntries),
}));

export const chartsRelations = relations(charts, ({ many }) => ({
  chartEntries: many(chartEntries),
}));

export const chartEntriesRelations = relations(chartEntries, ({ one }) => ({
  song: one(songs, {
    fields: [chartEntries.songId],
    references: [songs.id],
  }),
  chart: one(charts, {
    fields: [chartEntries.chartId],
    references: [charts.id],
  }),
}));
