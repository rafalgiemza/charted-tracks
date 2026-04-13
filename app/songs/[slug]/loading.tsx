import { Skeleton } from "@/components/ui/skeleton";

export default function SongLoading() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">

      {/* Breadcrumb skeleton */}
      <Skeleton className="h-4 w-48 mb-6" />

      {/* Header skeleton */}
      <div className="flex items-start gap-5 mb-8">
        <Skeleton className="h-24 w-24 rounded-md shrink-0" />
        <div className="space-y-2 min-w-0 flex-1">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-lg border border-border bg-card p-5">
        <Skeleton className="h-4 w-40 mb-4" />
        <Skeleton className="h-80 w-full" />
      </div>

    </main>
  );
}
