import * as cheerio from "cheerio"

export interface CrawledEvent {
  title: string
  description?: string
  startDate?: string
  endDate?: string
  location?: string
  url?: string
  category?: string
}

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

// ─── helpers ──────────────────────────────────────────────────────────────────

function asStr(v: unknown): string {
  return typeof v === "string" ? v : ""
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

function pickStr(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    const s = asStr(v).trim()
    if (s) return s
  }
  return undefined
}

function extractBody(v: unknown): string | undefined {
  if (!v) return undefined
  if (typeof v === "string") {
    const s = stripHtml(v).substring(0, 500)
    return s || undefined
  }
  if (typeof v === "object") {
    const o = v as Record<string, unknown>
    return extractBody(o.processed ?? o.value ?? o.summary)
  }
  return undefined
}

function deduplicate(events: CrawledEvent[]): CrawledEvent[] {
  const seen = new Set<string>()
  return events.filter((e) => {
    const key = `${e.title}|${e.startDate ?? ""}|${e.url ?? ""}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ─── recursive JSON event extractor ───────────────────────────────────────────

function collectEvents(
  data: unknown,
  baseUrl: string,
  out: CrawledEvent[],
  seen: Set<string>,
  depth = 0
): void {
  if (depth > 25 || !data || typeof data !== "object") return

  if (Array.isArray(data)) {
    for (const item of data) collectEvents(item, baseUrl, out, seen, depth + 1)
    return
  }

  const obj = data as Record<string, unknown>

  // ── JSON-LD @type Event ──────────────────────────────────────────────────
  const type = obj["@type"]
  if (
    type === "Event" ||
    (Array.isArray(type) && (type as string[]).includes("Event"))
  ) {
    const title = asStr(obj.name)
    if (title) {
      const loc = obj.location as Record<string, unknown> | undefined
      const key = `${title}|${asStr(obj.startDate)}`
      if (!seen.has(key)) {
        seen.add(key)
        out.push({
          title,
          description: extractBody(obj.description),
          startDate: pickStr(obj.startDate),
          endDate: pickStr(obj.endDate),
          location: pickStr(loc?.name, loc?.address),
          url: pickStr(obj.url) ?? baseUrl,
        })
      }
    }
    return // don't recurse into event node
  }

  // ── JSON-LD ItemList ─────────────────────────────────────────────────────
  if (type === "ItemList" && Array.isArray(obj.itemListElement)) {
    for (const item of obj.itemListElement as Record<string, unknown>[]) {
      collectEvents(item.item ?? item, baseUrl, out, seen, depth + 1)
    }
    return
  }

  // ── Drupal / Gatsby: fieldDateTimeTimezone ───────────────────────────────
  if (obj.fieldDateTimeTimezone && typeof obj.title === "string" && obj.title) {
    const tz = obj.fieldDateTimeTimezone as Record<string, string>
    const urlObj = obj.fieldEventUrl as Record<string, string> | undefined
    const typeEntity = (
      obj.fieldEventType as Record<string, Record<string, unknown>> | undefined
    )?.entity
    const key = `${obj.title}|${tz.startDate ?? ""}`
    if (!seen.has(key)) {
      seen.add(key)
      out.push({
        title: obj.title,
        description: extractBody(
          obj.body ?? obj.description ?? obj.fieldDescription ?? obj.fieldSummary
        ),
        startDate: pickStr(tz.startDate),
        endDate: pickStr(tz.endDate),
        location: pickStr(
          obj.fieldEventLocation,
          obj.fieldLocation,
          obj.field_event_location
        ),
        url: pickStr(urlObj?.uri) ?? baseUrl,
        category: pickStr(typeEntity?.name),
      })
    }
    return // don't recurse deeper into this node
  }

  // ── Generic: object with startDate/start_date + title/name ──────────────
  const hasDate =
    "startDate" in obj || "start_date" in obj || "date" in obj || "event_date" in obj
  const titleVal = asStr(obj.title || obj.name)
  if (hasDate && titleVal) {
    const rawDate =
      asStr(obj.startDate || obj.start_date || obj.date || obj.event_date)
    const key = `${titleVal}|${rawDate}`
    if (!seen.has(key) && isEventLike(obj)) {
      seen.add(key)
      out.push({
        title: titleVal,
        description: extractBody(
          obj.description ?? obj.body ?? obj.excerpt ?? obj.summary
        ),
        startDate: rawDate || undefined,
        endDate: pickStr(obj.endDate ?? obj.end_date),
        location: pickStr(
          obj.location,
          obj.venue,
          obj.address,
          obj.city,
          obj.place
        ),
        url: pickStr(obj.url ?? obj.link ?? obj.href) ?? baseUrl,
        category: pickStr(obj.category ?? obj.type ?? obj.event_type),
      })
      return
    }
  }

  // recurse
  for (const val of Object.values(obj)) {
    if (val && typeof val === "object") {
      collectEvents(val, baseUrl, out, seen, depth + 1)
    }
  }
}

/** Rough heuristic: does this object look like an event (not a blog post etc.)? */
function isEventLike(obj: Record<string, unknown>): boolean {
  const keys = Object.keys(obj).join(" ").toLowerCase()
  return (
    keys.includes("event") ||
    keys.includes("venue") ||
    keys.includes("location") ||
    keys.includes("startdate") ||
    keys.includes("start_date") ||
    keys.includes("enddate")
  )
}

// ─── Gatsby page-data.json ─────────────────────────────────────────────────

async function tryGatsby(targetUrl: string, html: string): Promise<CrawledEvent[]> {
  const origin = new URL(targetUrl).origin
  const pagePath = new URL(targetUrl).pathname.replace(/\/$/, "") || "/"

  // Extract Gatsby asset prefix from CSS/JS link hrefs, e.g. /en-website-assets/
  const prefixMatch =
    html.match(/data-href="(\/[^/"]+)\/[\w.-]+\.css"/) ??
    html.match(/src="(\/[^/"]+)\/[\w.-]+\.js"/)
  const prefix = prefixMatch?.[1] ?? ""

  const candidates = [
    `${origin}${prefix}/page-data${pagePath}/page-data.json`,
    `${origin}/page-data${pagePath}/page-data.json`,
  ]

  for (const url of candidates) {
    try {
      const resp = await fetch(url, { headers: { "User-Agent": BROWSER_UA } })
      if (!resp.ok) continue
      const data = await resp.json()
      const events: CrawledEvent[] = []
      const seen = new Set<string>()
      collectEvents(data, targetUrl, events, seen)
      if (events.length > 0) return events
    } catch {
      // try next candidate
    }
  }
  return []
}

// ─── Next.js __NEXT_DATA__ ────────────────────────────────────────────────────

function tryNextJs(html: string, baseUrl: string): CrawledEvent[] {
  const match = html.match(
    /<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  )
  if (!match) return []
  try {
    const data = JSON.parse(match[1])
    const events: CrawledEvent[] = []
    const seen = new Set<string>()
    collectEvents(data, baseUrl, events, seen)
    return events
  } catch {
    return []
  }
}

// ─── HTML fallback ─────────────────────────────────────────────────────────

function extractFromHtml(
  $: cheerio.CheerioAPI,
  targetUrl: string
): CrawledEvent[] {
  const events: CrawledEvent[] = []

  // Ordered selectors — most specific first; stop when we get results
  const containerSelectors = [
    "[itemtype*='Event']",
    "[class*='event-card']",
    "[class*='event-item']",
    "[class*='event-listing']",
    "[data-event]",
    "article[class*='event']",
    "li[class*='event']",
    "div[class*='event']",
    "article",
  ]

  for (const selector of containerSelectors) {
    const found: CrawledEvent[] = []
    const $els = $(selector)

    // Skip if only 1 match — likely a wrapper, not individual cards
    if ($els.length < 2) continue

    $els.each((_, el) => {
      const $el = $(el)

      // Skip elements whose parent already matched (avoid double-counting)
      if ($el.parents(selector).length > 0) return

      const title = $el
        .find("h1,h2,h3,h4,[class*='title'],[class*='heading']")
        .first()
        .text()
        .trim()
      if (!title || title.length < 4) return

      const desc = $el
        .find("p,[class*='desc'],[class*='excerpt'],[class*='summary']")
        .first()
        .text()
        .trim()

      const dateEl = $el.find("time,[class*='date'],[class*='when']").first()
      const dateText =
        dateEl.attr("datetime") ?? dateEl.text().trim()

      const location = $el
        .find(
          "[class*='location'],[class*='venue'],[class*='place'],[class*='city'],[class*='where']"
        )
        .first()
        .text()
        .trim()

      let href = $el.find("a").first().attr("href") ?? ""
      try {
        href = href.startsWith("http")
          ? href
          : new URL(href, targetUrl).toString()
      } catch {
        href = targetUrl
      }

      found.push({
        title,
        description: desc.substring(0, 500) || undefined,
        startDate: dateText || undefined,
        location: location || undefined,
        url: href || targetUrl,
      })
    })

    if (found.length > 1) {
      events.push(...found)
      break
    }
  }

  // Last resort: headings adjacent to dates
  if (events.length === 0) {
    $("h2,h3,h4").each((_, el) => {
      const $el = $(el)
      const title = $el.text().trim()
      const context = $el.parent().text()
      const dateMatch = context.match(
        /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},?\s*\d{4}|\d{4}-\d{2}-\d{2}/i
      )
      if (title && dateMatch) {
        events.push({
          title,
          startDate: dateMatch[0],
          url: targetUrl,
        })
      }
    })
  }

  return events
}

// ─── main entry point ──────────────────────────────────────────────────────────

export async function crawlEventsFromUrl(
  targetUrl: string
): Promise<CrawledEvent[]> {
  const response = await fetch(targetUrl, {
    headers: { "User-Agent": BROWSER_UA },
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch: ${response.status} ${response.statusText}`
    )
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  // ── 1. JSON-LD in <script type="application/ld+json"> ─────────────────
  {
    const events: CrawledEvent[] = []
    const seen = new Set<string>()
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() ?? "")
        collectEvents(data, targetUrl, events, seen)
      } catch {
        // skip malformed
      }
    })
    if (events.length > 0) return deduplicate(events)
  }

  // ── 2. Next.js __NEXT_DATA__ ──────────────────────────────────────────
  const nextEvents = tryNextJs(html, targetUrl)
  if (nextEvents.length > 0) return deduplicate(nextEvents)

  // ── 3. Gatsby page-data.json ──────────────────────────────────────────
  const isGatsby =
    html.includes("___chunkMapping") ||
    html.includes("___gatsby") ||
    $('meta[name="generator"]')
      .attr("content")
      ?.toLowerCase()
      .includes("gatsby") === true
  if (isGatsby) {
    const gatsbyEvents = await tryGatsby(targetUrl, html)
    if (gatsbyEvents.length > 0) return deduplicate(gatsbyEvents)
  }

  // ── 4. HTML pattern matching ──────────────────────────────────────────
  const htmlEvents = extractFromHtml($, targetUrl)
  return deduplicate(htmlEvents)
}
