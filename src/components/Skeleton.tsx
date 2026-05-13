/** Reusable shimmer skeleton components for loading states. */

/* ── shared shimmer base ─────────────────────────────────────────────── */
const shimmer = "animate-pulse bg-gray-200 dark:bg-gray-700 rounded"

/* ── Event list row ─────────────────────────────────────────────────── */
export function EventRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 px-6 py-4">
          {/* date column */}
          <div className="flex-shrink-0 w-14 space-y-1.5 pt-1">
            <div className={`${shimmer} h-3 w-9 mx-auto`} />
            <div className={`${shimmer} h-7 w-7 mx-auto`} />
          </div>
          {/* content */}
          <div className="flex-1 min-w-0 space-y-2 py-1">
            <div className="flex items-center gap-2">
              <div className={`${shimmer} h-4 w-44`} />
              <div className={`${shimmer} h-4 w-20 rounded-full`} />
            </div>
            <div className={`${shimmer} h-3 w-3/4`} />
            <div className="flex gap-4">
              <div className={`${shimmer} h-3 w-32`} />
              <div className={`${shimmer} h-3 w-24`} />
            </div>
          </div>
          {/* action button */}
          <div className={`${shimmer} h-8 w-8 flex-shrink-0 self-center`} />
        </div>
      ))}
    </div>
  )
}

/* ── Admin event row (wider, with user column) ───────────────────────── */
export function AdminEventRowSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 px-6 py-4">
          <div className="flex-shrink-0 w-14 space-y-1.5 pt-1">
            <div className={`${shimmer} h-3 w-9 mx-auto`} />
            <div className={`${shimmer} h-7 w-7 mx-auto`} />
          </div>
          <div className="flex-1 min-w-0 space-y-2 py-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`${shimmer} h-4 w-52`} />
              <div className={`${shimmer} h-4 w-20 rounded-full`} />
              <div className={`${shimmer} h-4 w-12 rounded-full`} />
            </div>
            <div className="flex gap-4">
              <div className={`${shimmer} h-3 w-36`} />
              <div className={`${shimmer} h-3 w-28`} />
              <div className={`${shimmer} h-3 w-24`} />
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0 self-center">
            <div className={`${shimmer} h-8 w-8`} />
            <div className={`${shimmer} h-8 w-8`} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Dashboard stat card ─────────────────────────────────────────────── */
export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className={`${shimmer} h-4 w-24`} />
        <div className={`${shimmer} h-9 w-9 rounded-lg`} />
      </div>
      <div className={`${shimmer} h-8 w-16 mb-1`} />
      <div className={`${shimmer} h-3 w-32`} />
    </div>
  )
}

/* ── Calendar grid ───────────────────────────────────────────────────── */
export function CalendarGridSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 animate-pulse">
      {/* month header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className={`${shimmer} h-6 w-36`} />
        <div className="flex gap-2">
          <div className={`${shimmer} h-8 w-8 rounded-lg`} />
          <div className={`${shimmer} h-8 w-8 rounded-lg`} />
        </div>
      </div>
      {/* day-name headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className={`${shimmer} h-5 w-8 mx-auto`} />
        ))}
      </div>
      {/* day cells */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-14 sm:h-20 bg-gray-50 dark:bg-gray-800/50 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}
