import { NextRequest } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get("category")
  const search = searchParams.get("search")
  const source = searchParams.get("source")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  const where: Record<string, unknown> = {}

  if (category && category !== "all") where.category = category
  if (source && source !== "all") where.source = source
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { location: { contains: search } },
      { organizer: { contains: search } },
    ]
  }
  if (startDate) {
    where.startDate = { ...(where.startDate as object || {}), gte: new Date(startDate) }
  }
  if (endDate) {
    where.startDate = { ...(where.startDate as object || {}), lte: new Date(endDate) }
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { startDate: "asc" },
  })

  return Response.json(events)
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  const body = await request.json()

  if (!body.title || !body.startDate) {
    return Response.json({ error: "Title and start date are required" }, { status: 400 })
  }

  const event = await prisma.event.create({
    data: {
      title: body.title,
      description: body.description || null,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      location: body.location || null,
      url: body.url || null,
      category: body.category || "General",
      organizer: body.organizer || null,
      source: body.source || "manual",
      sourceUrl: body.sourceUrl || null,
      isAllDay: body.isAllDay || false,
      userId: session.userId,
    },
  })

  return Response.json(event, { status: 201 })
}
