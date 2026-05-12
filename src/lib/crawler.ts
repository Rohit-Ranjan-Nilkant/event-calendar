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

function deduplicateEvents(events: CrawledEvent[]): CrawledEvent[] {
  const seen = new Set<string>()
  return events.filter((e) => {
    const key = `${e.title}|${e.startDate ?? ""}|${e.url ?? ""}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Attempt to normalise a fuzzy date string into ISO-ish. Returns original if no improvement. */
function normaliseDate(raw: string): string {
  if (!raw) return raw
  // Already ISO-like
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw
  const d = new Date(raw)
  if (!isNaN(d.getTime())) return d.toISOString()
  return raw
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
    return
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
    return
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
        startDate: rawDate ? normaliseDate(rawDate) : undefined,
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

  for (const val of Object.values(obj)) {
    if (val && typeof val === "object") {
      collectEvents(val, baseUrl, out, seen, depth + 1)
    }
  }
}

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

// ─── WordPress The Events Calendar (Tribe) REST API ──────────────────────────

async function tryTribeRestApi(targetUrl: string): Promise<CrawledEvent[]> {
  const origin = new URL(targetUrl).origin
  const apiBase = `${origin}/wp-json/tribe/events/v1/events`
  const events: CrawledEvent[] = []

  try {
    let page = 1
    let totalPages = 1
    while (page <= totalPages && page <= 5) {
      const resp = await fetch(`${apiBase}?per_page=50&page=${page}&status=publish`, {
        headers: { "User-Agent": BROWSER_UA },
      })
      if (!resp.ok) break
      const data = await resp.json() as {
        events?: Record<string, unknown>[]
        total_pages?: number
      }
      if (!data.events?.length) break
      if (page === 1) totalPages = data.total_pages ?? 1

      for (const ev of data.events) {
        const title = asStr(ev.title)
        if (!title) continue
        const venue = ev.venue as Record<string, unknown> | undefined
        events.push({
          title,
          description: extractBody(ev.description ?? ev.excerpt),
          startDate: asStr(ev.start_date) || undefined,
          endDate: asStr(ev.end_date) || undefined,
          location: pickStr(venue?.venue, venue?.city, venue?.address),
          url: asStr(ev.url) || targetUrl,
          category: (() => {
            const cats = ev.categories as { name?: string }[] | undefined
            return cats?.[0]?.name
          })(),
        })
      }
      page++
    }
  } catch {
    return []
  }
  return events
}

// ─── Eventbrite ───────────────────────────────────────────────────────────────

async function tryEventbrite(targetUrl: string, html: string): Promise<CrawledEvent[]> {
  // Eventbrite embeds a server-side JSON data blob
  const match = html.match(
    /window\.__SERVER_DATA__\s*=\s*(\{[\s\S]*?\});\s*<\/script>/
  ) ?? html.match(/"events"\s*:\s*(\[[\s\S]*?\])\s*[,}]/)
  if (!match) return []
  try {
    const data = JSON.parse(match[1])
    const events: CrawledEvent[] = []
    const seen = new Set<string>()
    collectEvents(data, targetUrl, events, seen)
    if (events.length) return events
  } catch { /* ignore */ }
  return []
}

// ─── Lu.ma ────────────────────────────────────────────────────────────────────

async function tryLuma(targetUrl: string): Promise<CrawledEvent[]> {
  // Lu.ma exposes a public API for calendar slugs
  // https://lu.ma/api/v1/calendar/get-events?calendar_slug=XXX
  const urlObj = new URL(targetUrl)
  const slug = urlObj.pathname.replace(/^\//, "").split("/")[0]
  if (!slug) return []
  try {
    const resp = await fetch(
      `https://api.lu.ma/public/v1/calendar/list-events?calendar_api_id=${slug}&pagination_limit=50`,
      { headers: { "User-Agent": BROWSER_UA } }
    )
    if (!resp.ok) return []
    const data = await resp.json() as { entries?: { event?: Record<string, unknown> }[] }
    if (!data.entries?.length) return []
    return data.entries.map(({ event: ev }) => {
      if (!ev) return null
      return {
        title: asStr(ev.name),
        description: extractBody(ev.description),
        startDate: asStr(ev.start_at) || undefined,
        endDate: asStr(ev.end_at) || undefined,
        location: asStr(ev.location) || undefined,
        url: `https://lu.ma/${asStr(ev.url || ev.slug)}`,
      } as CrawledEvent
    }).filter((e): e is CrawledEvent => !!e?.title)
  } catch {
    return []
  }
}

// ─── Meetup ───────────────────────────────────────────────────────────────────

async function tryMeetup(targetUrl: string, html: string): Promise<CrawledEvent[]> {
  // Meetup inlines Apollo cache as __APOLLO_STATE__ or redux state
  const match = html.match(
    /window\.__APOLLO_STATE__\s*=\s*(\{[\s\S]*?\});\s*<\/script>/
  ) ?? html.match(/"__NEXT_DATA__"\s*[^>]*>([\s\S]*?)<\/script>/)
  if (!match) return []
  try {
    const data = JSON.parse(match[1])
    const events: CrawledEvent[] = []
    const seen = new Set<string>()
    collectEvents(data, targetUrl, events, seen)
    return events
  } catch {
    return []
  }
}

// ─── iCal / ICS ──────────────────────────────────────────────────────────────

async function tryIcal(targetUrl: string): Promise<CrawledEvent[]> {
  // Check if the URL looks like an ICS feed or if the Content-Type is ical
  const isIcs =
    targetUrl.toLowerCase().includes(".ics") ||
    targetUrl.toLowerCase().includes("format=ics") ||
    targetUrl.toLowerCase().includes("ical")
  if (!isIcs) return []

  try {
    const resp = await fetch(targetUrl, { headers: { "User-Agent": BROWSER_UA } })
    if (!resp.ok) return []
    const text = await resp.text()
    if (!text.includes("BEGIN:VCALENDAR")) return []
    return parseIcal(text, targetUrl)
  } catch {
    return []
  }
}

function parseIcal(ics: string, baseUrl: string): CrawledEvent[] {
  const events: CrawledEvent[] = []
  const blocks = ics.split("BEGIN:VEVENT")
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i]
    const get = (key: string) => {
      // handles folded lines (RFC 5545 line-folding)
      const unfolded = block.replace(/\r?\n[ \t]/g, "")
      const m = unfolded.match(new RegExp(`^${key}[^:]*:(.+)$`, "m"))
      return m ? m[1].trim() : undefined
    }
    const title = get("SUMMARY")
    if (!title) continue
    const dtstart = get("DTSTART")
    const dtend = get("DTEND")
    events.push({
      title: title.replace(/\\,/g, ",").replace(/\\n/g, " "),
      description: (get("DESCRIPTION") ?? "")
        .replace(/\\,/g, ",")
        .replace(/\\n/g, " ")
        .substring(0, 500) || undefined,
      startDate: dtstart ? icalDateToIso(dtstart) : undefined,
      endDate: dtend ? icalDateToIso(dtend) : undefined,
      location: (get("LOCATION") ?? "").replace(/\\,/g, ",") || undefined,
      url: get("URL") ?? baseUrl,
    })
  }
  return events
}

function icalDateToIso(raw: string): string {
  // Strip VALUE= and TZID= prefixes: DTSTART;TZID=America/New_York:20260530T090000
  const val = raw.includes(":") ? raw.split(":").pop()! : raw
  if (/^\d{8}T\d{6}Z?$/.test(val)) {
    // 20260530T090000 → 2026-05-30T09:00:00
    const d = val.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, "$1-$2-$3T$4:$5:$6")
    return val.endsWith("Z") ? d.replace(/Z$/, "") + "Z" : d
  }
  if (/^\d{8}$/.test(val)) {
    return `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`
  }
  return raw
}

// ─── Gatsby page-data.json ─────────────────────────────────────────────────

async function tryGatsby(targetUrl: string, html: string): Promise<CrawledEvent[]> {
  const origin = new URL(targetUrl).origin
  const pagePath = new URL(targetUrl).pathname.replace(/\/$/, "") || "/"

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
    } catch { /* try next */ }
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
    if ($els.length < 2) continue

    $els.each((_, el) => {
      const $el = $(el)
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
      const dateText = dateEl.attr("datetime") ?? dateEl.text().trim()

      const location = $el
        .find("[class*='location'],[class*='venue'],[class*='place'],[class*='city'],[class*='where']")
        .first()
        .text()
        .trim()

      let href = $el.find("a").first().attr("href") ?? ""
      try {
        href = href.startsWith("http") ? href : new URL(href, targetUrl).toString()
      } catch { href = targetUrl }

      found.push({
        title,
        description: desc.substring(0, 500) || undefined,
        startDate: dateText ? normaliseDate(dateText) : undefined,
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
        events.push({ title, startDate: normaliseDate(dateMatch[0]), url: targetUrl })
      }
    })
  }

  return events
}

// ─── Pagination: discover more event pages linked from listing page ───────────

async function tryLinkedEventPages(
  $: cheerio.CheerioAPI,
  targetUrl: string,
  existingCount: number
): Promise<CrawledEvent[]> {
  if (existingCount >= 10) return []

  const origin = new URL(targetUrl).origin
  const candidates: string[] = []

  // Look for "next page" links
  $("a[rel='next'], a[aria-label*='next'], a[class*='next'], a[class*='pagination']").each((_, el) => {
    const href = $(el).attr("href") ?? ""
    try {
      const resolved = href.startsWith("http") ? href : new URL(href, targetUrl).toString()
      if (resolved !== targetUrl) candidates.push(resolved)
    } catch { /* skip */ }
  })

  // WP pagination: /page/2/, ?paged=2
  if (!candidates.length) {
    const currentUrl = new URL(targetUrl)
    const paged = parseInt(currentUrl.searchParams.get("paged") ?? "0", 10)
    if (paged >= 0) {
      currentUrl.searchParams.set("paged", String(paged + 1))
      candidates.push(currentUrl.toString())
    } else {
      // try /page/2/
      const base = targetUrl.replace(/\/$/, "")
      candidates.push(`${base}/page/2/`)
    }
  }

  const extra: CrawledEvent[] = []
  for (const url of candidates.slice(0, 2)) {
    try {
      const resp = await fetch(url, { headers: { "User-Agent": BROWSER_UA } })
      if (!resp.ok) continue
      const html = await resp.text()
      const $page = cheerio.load(html)
      const found = extractFromHtml($page, url)
      extra.push(...found)
    } catch { /* skip */ }
  }
  return extra
}

// ─── main entry point ──────────────────────────────────────────────────────────

export async function crawlEventsFromUrl(
  targetUrl: string
): Promise<CrawledEvent[]> {
  // ── 0. iCal/ICS feed ─────────────────────────────────────────────────────
  const icalEvents = await tryIcal(targetUrl)
  if (icalEvents.length > 0) return deduplicateEvents(icalEvents)

  // ── 0b. WordPress Tribe REST API ─────────────────────────────────────────
  const tribeEvents = await tryTribeRestApi(targetUrl)
  if (tribeEvents.length > 0) return deduplicateEvents(tribeEvents)

  const response = await fetch(targetUrl, {
    headers: { "User-Agent": BROWSER_UA },
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)
  const hostname = new URL(targetUrl).hostname

  // ── 1. JSON-LD ────────────────────────────────────────────────────────────
  {
    const events: CrawledEvent[] = []
    const seen = new Set<string>()
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() ?? "")
        collectEvents(data, targetUrl, events, seen)
      } catch { /* skip */ }
    })
    if (events.length > 0) return deduplicateEvents(events)
  }

  // ── 2. Next.js __NEXT_DATA__ ──────────────────────────────────────────────
  const nextEvents = tryNextJs(html, targetUrl)
  if (nextEvents.length > 0) return deduplicateEvents(nextEvents)

  // ── 3. Gatsby page-data.json ──────────────────────────────────────────────
  const isGatsby =
    html.includes("___chunkMapping") ||
    html.includes("___gatsby") ||
    $('meta[name="generator"]').attr("content")?.toLowerCase().includes("gatsby") === true
  if (isGatsby) {
    const gatsbyEvents = await tryGatsby(targetUrl, html)
    if (gatsbyEvents.length > 0) return deduplicateEvents(gatsbyEvents)
  }

  // ── 4. Eventbrite ─────────────────────────────────────────────────────────
  if (hostname.includes("eventbrite")) {
    const ebEvents = await tryEventbrite(targetUrl, html)
    if (ebEvents.length > 0) return deduplicateEvents(ebEvents)
  }

  // ── 5. Lu.ma ──────────────────────────────────────────────────────────────
  if (hostname.includes("lu.ma") || hostname.includes("luma")) {
    const lumaEvents = await tryLuma(targetUrl)
    if (lumaEvents.length > 0) return deduplicateEvents(lumaEvents)
  }

  // ── 6. Meetup ─────────────────────────────────────────────────────────────
  if (hostname.includes("meetup.com")) {
    const meetupEvents = await tryMeetup(targetUrl, html)
    if (meetupEvents.length > 0) return deduplicateEvents(meetupEvents)
  }

  // ── 7. HTML pattern matching (+ pagination if sparse) ────────────────────
  let htmlEvents = extractFromHtml($, targetUrl)
  if (htmlEvents.length < 5) {
    const extra = await tryLinkedEventPages($, targetUrl, htmlEvents.length)
    htmlEvents = [...htmlEvents, ...extra]
  }

  return deduplicateEvents(htmlEvents)
}
