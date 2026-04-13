import { Skeleton } from "@/components/ui/skeleton";

export default function ArtistLoading() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10 space-y-10">

      {/* Breadcrumb */}
      <Skeleton className="h-4 w-32" />

      {/* Artist header */}
      <header className="space-y-6">
        <div className="flex items-end gap-4">
          <Skeleton className="h-20 w-20 rounded-full shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>

        {/* Stat karty */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border px-4 py-3 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-10" />
            </div>
          ))}
        </div>
      </header>

      <Skeleton className="h-px w-full" />

      {/* Discography */}
      <section>
        <Skeleton className="h-4 w-32 mb-4 ml-4" />
        <div className="flex flex-col gap-0.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg">
              <Skeleton className="h-4 w-6 shrink-0" />
              <Skeleton className="h-11 w-11 rounded shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="hidden sm:block h-8 w-10 rounded-md shrink-0" />
              <Skeleton className="hidden sm:block h-4 w-12 shrink-0" />
              <Skeleton className="hidden md:block h-9 w-20 shrink-0" />
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
