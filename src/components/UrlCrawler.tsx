"use client"

import { useState } from "react"
import { Globe, Loader2, Calendar, MapPin, Tag, Sparkles, AlertTriangle } from "lucide-react"
import toast from "react-hot-toast"

interface CrawledEvent {
  title: string
  description?: string
  startDate?: string
  endDate?: string
  location?: string
  url?: string
  category?: string
}

const PAGE_SIZE = 50

interface UrlCrawlerProps {
  isSuperAdmin?: boolean
}

export default function UrlCrawler({ isSuperAdmin = false }: UrlCrawlerProps) {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [useLLM, setUseLLM] = useState(false)
  const [crawledEvents, setCrawledEvents] = useState<CrawledEvent[]>([])
  const [selectedEvents, setSelectedEvents] = useState<Set<number>>(new Set())
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [importing, setImporting] = useState(false)
  const [previouslyScrapped, setPreviouslyScrapped] = useState(false)
  const [lastScrape, setLastScrape] = useState<string | null>(null)

  const handleCrawl = async () => {
    if (!url) return

    setLoading(true)
    setCrawledEvents([])
    setSelectedEvents(new Set())
    setVisibleCount(PAGE_SIZE)
    setPreviouslyScrapped(false)
    setLastScrape(null)

    try {
      const res = await fetch("/api/upload/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, useLLM }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Crawl failed")

      if (data.previouslyScrapped) {
        setPreviouslyScrapped(true)
        setLastScrape(data.lastScrape)
      }

      if (data.events.length === 0) {
        toast.error("No events found on this page")
        return
      }

      setCrawledEvents(data.events)
      setSelectedEvents(new Set(data.events.slice(0, 200).map((_: CrawledEvent, i: number) => i)))
      toast.success(`Found ${data.events.length} event${data.events.length !== 1 ? "s" : ""}!`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Crawl failed")
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    const eventsToImport = crawledEvents.filter((_, i) => selectedEvents.has(i))
    if (eventsToImport.length === 0) return

    setImporting(true)
    try {
      const res = await fetch("/api/upload/url", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: eventsToImport, sourceUrl: url }),
      })

      const data = await res.json() as { imported: number; duplicates: number; total: number; error?: string }
      if (!res.ok) throw new Error(data.error || "Import failed")

      const parts = [`Imported ${data.imported} event${data.imported !== 1 ? "s" : ""}`]
      if (data.duplicates > 0) parts.push(`${data.duplicates} duplicate${data.duplicates !== 1 ? "s" : ""} skipped`)
      toast.success(parts.join(", ") + "!")

      setCrawledEvents([])
      setUrl("")
      setPreviouslyScrapped(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed")
    } finally {
      setImporting(false)
    }
  }

  const toggleEvent = (index: number) => {
    const next = new Set(selectedEvents)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    setSelectedEvents(next)
  }

  const toggleAll = () => {
    if (selectedEvents.size === crawledEvents.length) {
      setSelectedEvents(new Set())
    } else {
      setSelectedEvents(new Set(crawledEvents.map((_, i) => i)))
    }
  }

  const formatDate = (raw?: string) => {
    if (!raw) return null
    try {
      return new Date(raw).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    } catch { return raw }
  }

  const visible = crawledEvents.slice(0, visibleCount)
  const hasAnthropicKey = typeof window !== "undefined" // key presence checked server-side

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fetch Data from URL</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Paste an events page URL and we&apos;ll extract all events automatically.
          Supports JSON-LD, WordPress/Tribe, iCal, Eventbrite, Lu.ma, Meetup, and HTML layouts.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCrawl()}
              placeholder="https://example.com/events"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>
          <button
            onClick={handleCrawl}
            disabled={loading || !url}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap transition-colors"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Fetching…" : "Fetch Data"}
          </button>
        </div>

        {/* LLM toggle — SUPER_ADMIN only */}
        {isSuperAdmin && (
          <>
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={useLLM}
                  onChange={(e) => setUseLLM(e.target.checked)}
                />
                <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 peer-checked:bg-indigo-600 rounded-full transition-colors" />
                <div className="absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow" />
              </div>
              <span className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Use AI (Claude) for extraction
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">(requires ANTHROPIC_API_KEY)</span>
            </label>
            {useLLM && !hasAnthropicKey && (
              <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                AI extraction will silently fall back to standard crawling if the API key is not set.
              </p>
            )}
          </>
        )}
      </div>

      {/* Previously scraped warning */}
      {previouslyScrapped && lastScrape && (
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            This URL was previously scraped on{" "}
            <strong>{new Date(lastScrape).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong>.
            Duplicate events will be skipped automatically on import.
          </span>
        </div>
      )}

      {crawledEvents.length > 0 && (
        <div className="space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Found{" "}
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{crawledEvents.length}</span>{" "}
              event{crawledEvents.length !== 1 ? "s" : ""} —{" "}
              {selectedEvents.size} selected
            </p>
            <button
              onClick={toggleAll}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
            >
              {selectedEvents.size === crawledEvents.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          {crawledEvents.length > 100 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2.5 text-sm text-amber-800 dark:text-amber-300">
              Large result set — showing {visibleCount} of {crawledEvents.length}.
              Review and deselect any you don&apos;t need before importing.
            </div>
          )}

          {/* Event list */}
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {visible.map((event, index) => (
              <label
                key={index}
                className={`flex items-start gap-3 p-3.5 border rounded-lg cursor-pointer transition-colors ${
                  selectedEvents.has(index)
                    ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedEvents.has(index)}
                  onChange={() => toggleEvent(index)}
                  className="mt-0.5 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
                      {event.title}
                    </h4>
                    {event.category && (
                      <span className="shrink-0 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
                        <Tag className="h-3 w-3" />
                        {event.category}
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {event.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(event.startDate)}
                        {event.endDate && event.endDate !== event.startDate && (
                          <> – {formatDate(event.endDate)}</>
                        )}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
              </label>
            ))}

            {visibleCount < crawledEvents.length && (
              <button
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className="w-full py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium border border-dashed border-indigo-300 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
              >
                Show {Math.min(PAGE_SIZE, crawledEvents.length - visibleCount)} more
                ({crawledEvents.length - visibleCount} remaining)
              </button>
            )}
          </div>

          {/* Import button */}
          <button
            onClick={handleImport}
            disabled={selectedEvents.size === 0 || importing}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {importing && <Loader2 className="h-4 w-4 animate-spin" />}
            Import {selectedEvents.size} Selected Event{selectedEvents.size !== 1 ? "s" : ""}
          </button>
        </div>
      )}
    </div>
  )
}
