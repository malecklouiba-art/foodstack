export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar skeleton */}
      <aside className="hidden w-64 shrink-0 flex-col gap-2 bg-zinc-900 p-4 md:flex">
        {/* Logo */}
        <div className="mb-4 flex items-center gap-2 px-2 pt-2">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-zinc-700" />
          <div className="h-5 w-24 animate-pulse rounded-lg bg-zinc-700" />
        </div>
        {/* Nav items */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
          >
            <div className="h-5 w-5 animate-pulse rounded-md bg-zinc-700" />
            <div
              className="h-4 animate-pulse rounded-md bg-zinc-700"
              style={{ width: `${60 + (i % 3) * 20}px` }}
            />
          </div>
        ))}
      </aside>

      {/* Main area */}
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-zinc-800" />
          <div className="h-9 w-32 animate-pulse rounded-xl bg-zinc-800" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-zinc-900 p-5"
            >
              <div className="mb-3 h-4 w-24 animate-pulse rounded-md bg-zinc-700" />
              <div className="h-8 w-32 animate-pulse rounded-lg bg-zinc-700" />
              <div className="mt-2 h-3 w-20 animate-pulse rounded-md bg-zinc-800" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="rounded-2xl bg-zinc-900 p-5">
          <div className="mb-4 h-5 w-36 animate-pulse rounded-lg bg-zinc-700" />
          {/* Table header */}
          <div className="mb-3 grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded-md bg-zinc-700" />
            ))}
          </div>
          {/* Table rows */}
          {Array.from({ length: 6 }).map((_, row) => (
            <div
              key={row}
              className="mb-3 grid grid-cols-4 gap-4 border-t border-zinc-800 pt-3"
            >
              {Array.from({ length: 4 }).map((_, col) => (
                <div
                  key={col}
                  className="h-4 animate-pulse rounded-md bg-zinc-800"
                  style={{ width: `${70 + ((row + col) % 3) * 10}%` }}
                />
              ))}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
