import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10 space-y-10">

      {/* Hero skeleton */}
      <section>
        <Skeleton className="h-3 w-48 mb-3" />
        <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-5">
          <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <div className="flex gap-4 mt-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="hidden sm:block h-9 w-20 shrink-0" />
        </div>
      </section>

      {/* Top 10 skeleton */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <div className="space-y-1">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg">
              <Skeleton className="h-4 w-7 shrink-0" />
              <Skeleton className="h-4 w-9 shrink-0" />
              <Skeleton className="h-11 w-11 rounded shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="hidden sm:block h-8 w-14 shrink-0" />
              <Skeleton className="hidden md:block h-9 w-20 shrink-0" />
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
