import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { archivePastEvents } from "@/lib/archive"

/** GET /api/admin/events/archive — returns archive stats */
export async function GET() {
  await requireAdmin()

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [total, recentCount] = await Promise.all([
    prisma.event.count({ where: { archived: true } }),
    prisma.event.count({ where: { archived: true, archivedAt: { gte: oneWeekAgo } } }),
  ])

  // Also count events that are still active but whose time has now passed
  const now = new Date()
  const pendingCount = await prisma.event.count({
    where: {
      archived: false,
      OR: [
        { endDate:  { lt: now } },
        { endDate: null, startDate: { lt: now } },
      ],
    },
  })

  return Response.json({ total, recentCount, pendingCount })
}

/** POST /api/admin/events/archive — immediately archive all past events */
export async function POST() {
  await requireAdmin()
  const archived = await archivePastEvents()
  return Response.json({ archived })
}
