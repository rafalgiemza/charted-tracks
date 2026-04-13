import type { ArtistPageData } from "@/lib/queries/artists";

type Props = {
  data: ArtistPageData;
};

export function ArtistHeader({ data }: Props) {
  const { name, originCountry, stats } = data;

  const statCards = [
    {
      label: "Charted songs",
      value: stats.totalSongs.toString(),
    },
    {
      label: "Best peak",
      value: stats.bestPeak > 0 ? `#${stats.bestPeak}` : "—",
      highlight: stats.bestPeak === 1,
    },
    {
      label: "Total weeks",
      value: stats.totalWeeksOnChart.toString(),
    },
    {
      label: "Countries",
      value: stats.countriesReached.toString(),
    },
  ];

  return (
    <header className="space-y-6">
      {/* Identyfikacja artysty */}
      <div className="flex items-end gap-4">
        {/* Avatar placeholder — do V2 można podmienić na zdjęcie z API */}
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-3xl shrink-0 border border-border">
          🎤
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          {originCountry && (
            <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
              <span>{countryCodeToFlag(originCountry)}</span>
              <span>{countryCodeToName(originCountry)}</span>
            </p>
          )}
        </div>
      </div>

      {/* Stat karty */}
      {stats.totalSongs > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-border bg-card px-4 py-3"
            >
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p
                className={
                  "text-2xl font-bold tracking-tight " +
                  (s.highlight ? "text-amber-500" : "")
                }
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

const COUNTRY_NAMES: Record<string, string> = {
  GB: "United Kingdom",
  US: "United States",
  PL: "Poland",
  DE: "Germany",
  FR: "France",
  IE: "Ireland",
  AU: "Australia",
  CA: "Canada",
};

function countryCodeToName(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] ?? code;
}
