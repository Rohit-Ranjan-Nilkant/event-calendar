"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import {
  ArrowLeft, Search, MapPin, Clock, ExternalLink,
  ArchiveRestore, Trash2, ChevronLeft, ChevronRight, ArchiveX,
} from "lucide-react"
import toast from "react-hot-toast"
import { AdminEventRowSkeleton } from "@/components/Skeleton"
import { useDebounce } from "@/hooks/useDebounce"

const PAGE_SIZE = 50

const categoryColors: Record<string, string> = {
  Conference: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Workshop:   "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Webinar:    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  Seminar:    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  Meetup:     "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  Training:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  Award:      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  Networking: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  General:    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
}

interface ArchivedEvent {
  id: string
  title: string
  description?: string
  startDate: string
  endDate?: string
  location?: string
  url?: string
  category?: string
  organizer?: string
  source?: string
  archivedAt?: string
  user?: { name?: string | null; email: string }
}

export default function ArchivedEventsPage() {
  const [events, setEvents]           = useState<ArchivedEvent[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal]             = useState(0)

  const debouncedSearch = useDebounce(search, 400)

  const fetchEvents = useCallback(async (pageNum = 1) => {
    setLoading(true)
    const params = new URLSearchParams({ archived: "true", page: String(pageNum), limit: String(PAGE_SIZE) })
    if (debouncedSearch) params.set("search", debouncedSearch)

    const res = await fetch(`/api/admin/events?${params}`)
    if (res.ok) {
      const data = await res.json()
      setEvents(data.events)
      setTotal(data.total)
      setCurrentPage(pageNum)
    }
    setLoading(false)
  }, [debouncedSearch])

  useEffect(() => { fetchEvents(1) }, [fetchEvents])

  const restoreEvent = async (id: string) => {
    const res = await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: false }),
    })
    if (res.ok) {
      toast.success("Event restored")
      setEvents((prev) => prev.filter((e) => e.id !== id))
      setTotal((t) => t - 1)
    } else {
      toast.error("Failed to restore event")
    }
  }

  const deleteEvent = async (id: string) => {
    if (!confirm("Permanently delete this event? This cannot be undone.")) return
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Event permanently deleted")
      setEvents((prev) => prev.filter((e) => e.id !== id))
      setTotal((t) => t - 1)
    } else {
      toast.error("Failed to delete event")
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const from       = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const to         = Math.min(currentPage * PAGE_SIZE, total)

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/events"
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ArchiveX className="h-6 w-6 text-amber-500" />
              Archived Events
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {loading ? "Loading…" : `${total} archived event${total !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <ArchiveX className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 dark:text-amber-200">
          <p className="font-medium mb-0.5">Events archived automatically once their end time has passed.</p>
          <p className="text-amber-700 dark:text-amber-300 opacity-80">
            You can restore an event to make it visible again, or permanently delete it from here.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search archived events…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Event list */}
      {loading ? (
        <AdminEventRowSkeleton count={8} />
      ) : events.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-16 text-center">
          <ArchiveX className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">No archived events</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Events are archived automatically once their time has passed.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {events.map((event) => (
            <div key={event.id} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">

              {/* Date column — muted since it's past */}
              <div className="flex-shrink-0 w-14 text-center pt-1 opacity-50">
                <div className="text-xs font-semibold text-gray-500 uppercase">
                  {format(parseISO(event.startDate), "MMM")}
                </div>
                <div className="text-2xl font-bold text-gray-500">
                  {format(parseISO(event.startDate), "d")}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{event.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full opacity-70 ${categoryColors[event.category || "General"] ?? categoryColors.General}`}>
                    {event.category}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    archived
                  </span>
                </div>
                {event.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5 line-clamp-1">{event.description}</p>
                )}
                <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(parseISO(event.startDate), "MMM d, yyyy h:mm a")}
                    {event.endDate && ` – ${format(parseISO(event.endDate), "h:mm a")}`}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                  )}
                  {event.archivedAt && (
                    <span className="text-amber-500 dark:text-amber-500">
                      Archived {format(parseISO(event.archivedAt), "MMM d 'at' h:mm a")}
                    </span>
                  )}
                  {event.url && (
                    <a href={event.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700">
                      <ExternalLink className="h-3 w-3" />Link
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => restoreEvent(event.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
                  title="Restore event"
                >
                  <ArchiveRestore className="h-3.5 w-3.5" /> Restore
                </button>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                  title="Permanently delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {from}–{to} of {total} archived events
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchEvents(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
              const p = start + i
              return (
                <button key={p} onClick={() => fetchEvents(p)}
                  className={`min-w-[36px] px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    p === currentPage ? "bg-indigo-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => fetchEvents(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
