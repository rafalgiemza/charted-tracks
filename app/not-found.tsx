import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="text-6xl mb-4">🎵</p>
      <h1 className="text-2xl font-bold mb-2">Not found</h1>
      <p className="text-muted-foreground mb-6">
        This song, artist, or page doesn&apos;t exist.
      </p>
      <Link href="/" className="text-sm underline underline-offset-4">
        Back to homepage
      </Link>
    </main>
  );
}
