"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import {
  PlusCircle, Search, Filter, MapPin, Clock,
  Trash2, Edit2, ExternalLink, User,
  ChevronLeft, ChevronRight, AlertTriangle,
} from "lucide-react"
import toast from "react-hot-toast"
import type { EventData } from "@/types"
import { AdminEventRowSkeleton } from "@/components/Skeleton"
import { useDebounce } from "@/hooks/useDebounce"

const CATEGORIES = ["all","General","Conference","Workshop","Webinar","Seminar","Meetup","Training","Award","Networking"]
const SOURCES    = ["all","manual","excel","url"]
const PAGE_SIZE  = 50

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

interface AdminEvent extends EventData {
  user?: { name?: string | null; email: string }
}

export default function AdminEventsPage() {
  const [events, setEvents]           = useState<AdminEvent[]>([])
  const [loading, setLoading]         = useState(true)
  const [category, setCategory]       = useState("all")
  const [source, setSource]           = useState("all")
  const [search, setSearch]           = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal]             = useState(0)
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearingAll, setClearingAll]   = useState(false)

  const debouncedSearch = useDebounce(search, 400)

  const fetchEvents = useCallback(async (pageNum = 1) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category !== "all") params.set("category", category)
    if (source !== "all")   params.set("source", source)
    if (debouncedSearch)    params.set("search", debouncedSearch)
    params.set("page",  String(pageNum))
    params.set("limit", String(PAGE_SIZE))

    const res = await fetch(`/api/admin/events?${params}`)
    if (res.ok) {
      const data = await res.json()
      setEvents(data.events)
      setTotal(data.total)
      setCurrentPage(pageNum)
    }
    setLoading(false)
  }, [category, source, debouncedSearch])

  // Reset to page 1 whenever filters change
  useEffect(() => { fetchEvents(1) }, [fetchEvents])

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Event deleted")
      setEvents((prev) => prev.filter((e) => e.id !== id))
      setTotal((t) => t - 1)
    } else {
      toast.error("Failed to delete")
    }
  }

  const clearAllEvents = async () => {
    setClearingAll(true)
    try {
      const res = await fetch("/api/admin/events", { method: "DELETE" })
      if (res.ok) {
        toast.success("All events cleared")
        setEvents([])
        setTotal(0)
        setCurrentPage(1)
        setConfirmClear(false)
      } else {
        toast.error("Failed to clear events")
      }
    } finally {
      setClearingAll(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const from       = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const to         = Math.min(currentPage * PAGE_SIZE, total)

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Events</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {loading ? "Loading…" : `${total} event${total !== 1 ? "s" : ""} total`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Clear All — inline confirm */}
          {confirmClear ? (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700 dark:text-red-300 font-medium whitespace-nowrap">
                Delete all {total} events?
              </span>
              <button
                onClick={clearAllEvents}
                disabled={clearingAll}
                className="text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-2.5 py-1 rounded transition-colors"
              >
                {clearingAll ? "Deleting…" : "Yes, clear all"}
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              disabled={total === 0}
              className="inline-flex items-center gap-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Clear All
            </button>
          )}

          <Link
            href="/admin/events/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle className="h-4 w-4" /> Add Event
          </Link>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search events… (auto-searches)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="pl-9 pr-8 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-indigo-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
            ))}
          </select>
        </div>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-indigo-500"
        >
          {SOURCES.map((s) => (
            <option key={s} value={s}>{s === "all" ? "All Sources" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* ── Event list ─────────────────────────────────────────────── */}
      {loading ? (
        <AdminEventRowSkeleton count={PAGE_SIZE > 10 ? 10 : PAGE_SIZE} />
      ) : events.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No events found</p>
          <Link href="/admin/events/new" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {events.map((event) => (
            <div key={event.id} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              {/* Date column */}
              <div className="flex-shrink-0 w-14 text-center pt-1">
                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase">
                  {format(parseISO(event.startDate), "MMM")}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {format(parseISO(event.startDate), "d")}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{event.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[event.category || "General"] ?? categoryColors.General}`}>
                    {event.category}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {event.source}
                  </span>
                </div>
                {event.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">{event.description}</p>
                )}
                <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 dark:text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(parseISO(event.startDate), "MMM d, yyyy h:mm a")}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{event.location}
                    </span>
                  )}
                  {event.user && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />{event.user.name ?? event.user.email}
                    </span>
                  )}
                  {event.url && (
                    <a href={event.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800">
                      <ExternalLink className="h-3 w-3" />Link
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Link
                  href={`/admin/events/${event.id}`}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => event.id && deleteEvent(event.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────────── */}
      {!loading && total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {from}–{to} of {total} events
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
              // show pages around current
              let p = i + 1
              if (totalPages > 5) {
                const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
                p = start + i
              }
              return (
                <button
                  key={p}
                  onClick={() => fetchEvents(p)}
                  className={`min-w-[36px] px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    p === currentPage
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
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
