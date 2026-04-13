import { readFileSync } from "fs";
import { resolve } from "path";

export interface CsvRow {
  chart_date: string;       // "YYYY-MM-DD"
  position: string;         // "1"–"100"
  title: string;
  artist: string;
  peak_position: string;
  weeks_on_chart: string;
}

export function parseCsv(relativePath: string): CsvRow[] {
  const absolutePath = resolve(process.cwd(), relativePath);
  const raw = readFileSync(absolutePath, "utf-8");

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error(`CSV jest pusty lub ma tylko nagłówek: ${relativePath}`);
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());

    if (values.length !== headers.length) {
      console.warn(`⚠️  Linia ${i + 1} ma ${values.length} kolumn (oczekiwano ${headers.length}), pomijam.`);
      continue;
    }

    const row = Object.fromEntries(
      headers.map((header, idx) => [header, values[idx]])
    ) as CsvRow;

    rows.push(row);
  }

  return rows;
}
