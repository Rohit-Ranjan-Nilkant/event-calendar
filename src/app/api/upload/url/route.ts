import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { crawlEventsFromUrl } from "@/lib/crawler"
import { extractEventsWithLLM } from "@/lib/llm-crawler"
import { autoTagEvent } from "@/lib/interests"

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

  const useLLM: boolean = body.useLLM === true

  // Check if we've scraped this URL before
  const existing = await prisma.scrapedUrl.findUnique({ where: { url: body.url } })

  let events
  try {
    if (useLLM) {
      // LLM path: fetch raw HTML, pass to claude-haiku-4-5
      const html = await fetch(body.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
      }).then((r) => r.text())
      events = await extractEventsWithLLM(html, body.url)
      // Fall back to standard crawler if LLM returned nothing
      if (!events.length) events = await crawlEventsFromUrl(body.url)
    } else {
      events = await crawlEventsFromUrl(body.url)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: `Crawl failed: ${message}` }, { status: 422 })
  }

  return Response.json({
    events,
    sourceUrl: body.url,
    previouslyScrapped: !!existing,
    lastScrape: existing?.lastScrape ?? null,
  })
}

export async function PUT(request: Request) {
  const session = await requireAdmin()
  const body = await request.json()

  if (!body.events || !Array.isArray(body.events)) {
    return Response.json({ error: "Events array is required" }, { status: 400 })
  }

  let imported = 0
  let duplicates = 0

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

    // Deduplication: same title + same day window (±12 h)
    const windowStart = new Date(startDate.getTime() - 12 * 60 * 60 * 1000)
    const windowEnd = new Date(startDate.getTime() + 12 * 60 * 60 * 1000)
    const dupe = await prisma.event.findFirst({
      where: {
        title: event.title,
        startDate: { gte: windowStart, lte: windowEnd },
      },
    })
    if (dupe) { duplicates++; continue }

    const tags = autoTagEvent(event.title, event.description, event.category)

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
        tags: tags || null,
        userId: session.userId,
      },
    })
    imported++
  }

  // Upsert ScrapedUrl record
  if (body.sourceUrl) {
    await prisma.scrapedUrl.upsert({
      where: { url: body.sourceUrl },
      update: {
        lastScrape: new Date(),
        eventCount: { increment: imported },
      },
      create: {
        url: body.sourceUrl,
        eventCount: imported,
      },
    })
  }

  return Response.json({ imported, duplicates, total: body.events.length })
}
