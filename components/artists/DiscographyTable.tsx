import type { ArtistPageData } from "@/lib/queries/artists";
import { DiscographyRow } from "./DiscographyRow";

type Props = {
  discography: ArtistPageData["discography"];
};

export function DiscographyTable({ discography }: Props) {
  if (discography.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground text-sm">
        No charted songs found for this artist.
      </div>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Charted songs
        </h2>
        {/* Nagłówki kolumn — wyrównane z DiscographyRow */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground uppercase tracking-wide">
          <span className="w-10 text-center">Peak</span>
          <span className="w-12 text-right">Weeks</span>
          <span className="hidden md:block w-20 text-right">Last 8w</span>
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        {discography.map((song, i) => (
          <DiscographyRow key={song.id} song={song} index={i} />
        ))}
      </div>
    </section>
  );
}
