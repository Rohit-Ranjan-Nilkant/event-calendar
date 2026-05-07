import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { crawlEventsFromUrl } from "@/lib/crawler"

export async function POST(request: Request) {
  const body = await request.json()
  if (!body.url) return Response.json({ error: "URL is required" }, { status: 400 })

  let url: URL
  try { url = new URL(body.url) } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 })
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    return Response.json({ error: "Only HTTP/HTTPS URLs are allowed" }, { status: 400 })
  }

  const events = await crawlEventsFromUrl(body.url)
  return Response.json({ events, sourceUrl: body.url })
}

export async function PUT(request: Request) {
  const session = await requireAdmin()
  const body = await request.json()

  if (!body.events || !Array.isArray(body.events)) {
    return Response.json({ error: "Events array is required" }, { status: 400 })
  }

  let imported = 0

  for (const event of body.events) {
    if (!event.title) continue
    let startDate: Date
    try {
      startDate = event.startDate ? new Date(event.startDate) : new Date()
      if (isNaN(startDate.getTime())) startDate = new Date()
    } catch { startDate = new Date() }

    let endDate: Date | null = null
    if (event.endDate) {
      try {
        const d = new Date(event.endDate)
        if (!isNaN(d.getTime())) endDate = d
      } catch { /* ignore */ }
    }

    await prisma.event.create({
      data: {
        title: event.title,
        description: event.description || null,
        startDate,
        endDate,
        location: event.location || null,
        url: event.url || null,
        category: event.category || "General",
        source: "url",
        sourceUrl: body.sourceUrl || null,
        userId: session.userId,
      },
    })
    imported++
  }

  return Response.json({ imported })
}
