"use client"

import { useState } from "react"
import { Globe, Loader2, Calendar, MapPin, Tag } from "lucide-react"
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

export default function UrlCrawler() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [crawledEvents, setCrawledEvents] = useState<CrawledEvent[]>([])
  const [selectedEvents, setSelectedEvents] = useState<Set<number>>(new Set())
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [importing, setImporting] = useState(false)

  const handleCrawl = async () => {
    if (!url) return

    setLoading(true)
    setCrawledEvents([])
    setSelectedEvents(new Set())
    setVisibleCount(PAGE_SIZE)

    try {
      const res = await fetch("/api/upload/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Crawl failed")

      if (data.events.length === 0) {
        toast.error("No events found on this page")
        return
      }

      setCrawledEvents(data.events)
      // Pre-select all by default (up to first 200)
      setSelectedEvents(
        new Set(
          data.events
            .slice(0, 200)
            .map((_: CrawledEvent, i: number) => i)
        )
      )
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

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Import failed")

      toast.success(`Imported ${data.imported} events!`)
      setCrawledEvents([])
      setUrl("")
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
      return new Date(raw).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return raw
    }
  }

  const visible = crawledEvents.slice(0, visibleCount)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import from URL</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Paste an events page URL and we&apos;ll extract all events automatically
        </p>
      </div>

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
          {loading ? "Crawling…" : "Crawl"}
        </button>
      </div>

      {crawledEvents.length > 0 && (
        <div className="space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Found{" "}
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                {crawledEvents.length}
              </span>{" "}
              event{crawledEvents.length !== 1 ? "s" : ""} —{" "}
              {selectedEvents.size} selected
            </p>
            <button
              onClick={toggleAll}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
            >
              {selectedEvents.size === crawledEvents.length
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>

          {/* Large result warning */}
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

            {/* Show more */}
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
            Import {selectedEvents.size} Selected Event
            {selectedEvents.size !== 1 ? "s" : ""}
          </button>
        </div>
      )}
    </div>
  )
}
