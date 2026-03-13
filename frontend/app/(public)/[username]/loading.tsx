export default function ProfileLoading() {
  return (
    <div className="w-full animate-pulse">
      {/* Hero skeleton */}
      <div className="relative h-56 md:h-72 bg-muted" />

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_320px] lg:gap-8">
          {/* Side nav skeleton */}
          <div className="hidden lg:block space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-28 rounded bg-muted" />
            ))}
          </div>

          {/* Main content skeleton */}
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="h-5 w-32 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>

          {/* Sidebar skeleton */}
          <div className="hidden lg:block">
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="h-5 w-24 rounded bg-muted" />
              <div className="h-10 w-full rounded bg-muted" />
              <div className="h-10 w-full rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
