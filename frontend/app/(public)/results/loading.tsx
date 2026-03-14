export default function ResultsLoading() {
  return (
    <div className="w-full animate-pulse">
      {/* Scope tabs skeleton */}
      <section className="sticky top-20 z-40 border-b border-border bg-background/92 backdrop-blur">
        <div className="container mx-auto px-4 py-4 space-y-3">
          <div className="h-4 w-48 rounded bg-muted" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 w-28 rounded-full bg-muted" />
            ))}
          </div>
        </div>
      </section>

      {/* Results grid skeleton */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl border border-border bg-card overflow-hidden">
                <div className="aspect-4/3 bg-muted" />
                <div className="p-6 space-y-4">
                  <div className="h-5 w-36 rounded bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-8 w-20 rounded-full bg-muted" />
                  <div className="h-3 w-32 rounded bg-muted" />
                  <div className="h-10 w-full rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
