import type { CrawledEvent } from "@/lib/crawler"

/**
 * Extract events from a webpage using Claude Haiku as a fallback/explicit option.
 * Returns [] if ANTHROPIC_API_KEY is not set or on any error.
 */
export async function extractEventsWithLLM(
  html: string,
  url: string
): Promise<CrawledEvent[]> {
  if (!process.env.ANTHROPIC_API_KEY) return []

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Strip HTML to plain text to reduce tokens
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12000)

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Extract all events from this webpage content. Return a JSON array only — no markdown, no explanation.

Each event object should have these fields (all optional except title):
- title: string (required)
- description: string
- startDate: ISO 8601 string (e.g. "2026-06-15T09:00:00")
- endDate: ISO 8601 string
- location: string
- url: string (full URL to the event page)
- category: one of Conference, Workshop, Webinar, Seminar, Meetup, Training, Award, Networking, General

Source URL: ${url}

Page content:
${text}`,
        },
      ],
    })

    const raw =
      response.content[0].type === "text" ? response.content[0].text : ""

    // Extract JSON array from response (handle potential markdown wrapping)
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    const parsed = JSON.parse(jsonMatch[0]) as CrawledEvent[]
    return Array.isArray(parsed) ? parsed.filter((e) => e.title) : []
  } catch {
    return []
  }
}
