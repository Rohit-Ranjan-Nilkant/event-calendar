import { NextRequest } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { INTEREST_KEYWORDS } from "@/lib/interests"
import { maybeArchivePastEvents } from "@/lib/archive"

export async function GET(request: NextRequest) {
  // Silently archive past events in the background (rate-limited to 5 min intervals)
  void maybeArchivePastEvents()
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get("category")
  const search = searchParams.get("search")
  const source = searchParams.get("source")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const hearted = searchParams.get("hearted")
  const discover = searchParams.get("discover")
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = Math.min(500, Math.max(10, parseInt(searchParams.get("limit") ?? "500")))
  const skip = (page - 1) * limit

  const session = await getSession()

  // Users can browse past/archived events with ?archived=true
  const showArchived = searchParams.get("archived") === "true"

  const where: Record<string, unknown> = {
    archived: showArchived,
  }

  // When showing upcoming events, apply a real-time date fence so events disappear
  // the moment they end — regardless of when the background archive job last ran.
  if (!showArchived) {
    const now = new Date()
    where.AND = [
      {
        OR: [
          { endDate: { gte: now } },             // event hasn't ended yet
          { endDate: null, startDate: { gte: now } }, // all-day / no end — hasn't started yet
        ],
      },
    ]
  }

  // ── hearted: return only saved events for current user ────────────────────
  if (hearted === "true") {
    if (!session) return Response.json([])
    const saved = await prisma.userEvent.findMany({
      where: { userId: session.userId },
      select: { eventId: true },
    })
    where.id = { in: saved.map((s) => s.eventId) }
  }

  // ── discover: return events matching user's interests ─────────────────────
  if (discover === "true" && session) {
    const interests = await prisma.userInterest.findMany({
      where: { userId: session.userId },
      select: { interest: true },
    })
    if (interests.length > 0) {
      const keywords: string[] = []
      for (const { interest } of interests) {
        const kws = INTEREST_KEYWORDS[interest] ?? [interest.toLowerCase()]
        keywords.push(...kws)
      }
      const uniqueKws = [...new Set(keywords)]
      where.OR = uniqueKws.map((kw) => ({
        OR: [
          { title: { contains: kw, mode: "insensitive" } },
          { description: { contains: kw, mode: "insensitive" } },
          { category: { contains: kw, mode: "insensitive" } },
          { tags: { contains: kw, mode: "insensitive" } },
        ],
      }))
    }
  }

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
  if (startDate) {
    where.startDate = { ...(where.startDate as object || {}), gte: new Date(startDate) }
  }
  if (endDate) {
    where.startDate = { ...(where.startDate as object || {}), lte: new Date(endDate) }
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: showArchived
      ? { archivedAt: "desc" }  // most-recently archived first for past view
      : { startDate: "asc" },
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
      isAllDay: true,
      tags: true,
      archived: true,
      archivedAt: true,
    },
  })

  // Annotate with hearted status for the current user
  let heartedIds = new Set<string>()
  if (session) {
    const saved = await prisma.userEvent.findMany({
      where: { userId: session.userId, eventId: { in: events.map((e) => e.id) } },
      select: { eventId: true },
    })
    heartedIds = new Set(saved.map((s) => s.eventId))
  }

  return Response.json(events.map((e) => ({ ...e, hearted: heartedIds.has(e.id) })))
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
