import { prisma } from "@/lib/prisma"

/**
 * Archives all events whose effective end time has passed:
 *   - Events with endDate set  → archive when endDate  < now
 *   - Events with no endDate   → archive when startDate < now
 *
 * Safe to call repeatedly — updateMany is a no-op when WHERE matches nothing.
 * Returns the total number of newly archived events.
 */
export async function archivePastEvents(): Promise<number> {
  const now = new Date()

  const [withEnd, withoutEnd] = await Promise.all([
    // Has an explicit end time that has already passed
    prisma.event.updateMany({
      where: { archived: false, endDate: { lt: now } },
      data:  { archived: true, archivedAt: now },
    }),
    // No end time — archive once the start time is past
    prisma.event.updateMany({
      where: { archived: false, endDate: null, startDate: { lt: now } },
      data:  { archived: true, archivedAt: now },
    }),
  ])

  return withEnd.count + withoutEnd.count
}

/**
 * Rate-limited wrapper: runs archivePastEvents() at most once every 5 minutes
 * per server process. Swallows errors so it never breaks a user-facing request.
 */
let _lastRun = 0
const INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export async function maybeArchivePastEvents(): Promise<void> {
  const now = Date.now()
  if (now - _lastRun < INTERVAL_MS) return
  _lastRun = now
  try {
    await archivePastEvents()
  } catch (err) {
    console.error("[archive] auto-archive failed:", err)
  }
}
