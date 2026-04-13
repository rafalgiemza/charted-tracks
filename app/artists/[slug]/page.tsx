import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { getArtistPageData } from "@/lib/queries/artists";
import { ArtistHeader } from "@/components/artists/ArtistHeader";
import { DiscographyTable } from "@/components/artists/DiscographyTable";

export const revalidate = 86400;

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

type Params = { slug: string };

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { slug } = await params;
  const data = await getArtistPageData(slug);
  if (!data) return { title: "Artist not found" };

  const desc =
    data.stats.totalSongs > 0
      ? `${data.name} has had ${data.stats.totalSongs} songs on the charts, ` +
        `with a best peak of #${data.stats.bestPeak} and ` +
        `${data.stats.totalWeeksOnChart} total weeks on chart.`
      : `Chart history for ${data.name} on ChartPulse.`;

  return {
    title: `${data.name} — Chart History | ChartPulse`,
    description: desc,
    openGraph: {
      title: `${data.name} on ChartPulse`,
      description: desc,
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ArtistPage(
  { params }: { params: Promise<Params> }
) {
  const { slug } = await params;
  const data = await getArtistPageData(slug);

  if (!data) notFound();

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10 space-y-10">

      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{data.name}</span>
      </nav>

      {/* Hero — avatar, nazwa, kraj, stat karty */}
      <ArtistHeader data={data} />

      {/* Divider */}
      <hr className="border-border" />

      {/* Discography */}
      <DiscographyTable discography={data.discography} />

    </main>
  );
}
