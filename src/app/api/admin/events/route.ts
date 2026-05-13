import { NextRequest } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  await requireAdmin()

  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get("category")
  const source = searchParams.get("source")
  const search = searchParams.get("search")
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") ?? "50")))
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (category && category !== "all") where.category = category
  if (source && source !== "all") where.source = source
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
      { organizer: { contains: search, mode: "insensitive" } },
    ]
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { startDate: "asc" },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        url: true,
        category: true,
        organizer: true,
        source: true,
        sourceUrl: true,
        isAllDay: true,
        tags: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.event.count({ where }),
  ])

  return Response.json({ events, total, page, limit })
}

export async function DELETE() {
  await requireAdmin()

  // Remove UserEvent associations first (FK constraint), then all events
  await prisma.$transaction([
    prisma.userEvent.deleteMany({}),
    prisma.event.deleteMany({}),
  ])

  return Response.json({ success: true })
}
