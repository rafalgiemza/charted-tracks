export { artists } from "./artists";
export type { Artist, NewArtist } from "./artists";

export { songs } from "./songs";
export type { Song, NewSong } from "./songs";

export { charts } from "./charts";
export type { Chart, NewChart } from "./charts";

export { chartEntries } from "./chart-entries";
export type { ChartEntry, NewChartEntry } from "./chart-entries";

// relacje wydzielone osobno — unikamy circular imports
export {
  artistsRelations,
  songsRelations,
  chartsRelations,
  chartEntriesRelations,
} from "./relations";
