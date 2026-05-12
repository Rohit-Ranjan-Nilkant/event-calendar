"use client"

import { useState, useEffect, useCallback } from "react"
import { Heart, MapPin, Clock, ExternalLink, Calendar } from "lucide-react"
import { format, parseISO } from "date-fns"
import Link from "next/link"
import HeartButton from "@/components/HeartButton"
import type { EventData } from "@/types"

export default function MyCalendarPage() {
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHearted = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/events?hearted=true")
    if (res.ok) {
      const data = await res.json()
      setEvents(
        data.map((e: Record<string, unknown>) => ({
          ...e,
          startDate:
            typeof e.startDate === "string"
              ? e.startDate
              : new Date(e.startDate as number).toISOString(),
          endDate: e.endDate
            ? typeof e.endDate === "string"
              ? e.endDate
              : new Date(e.endDate as number).toISOString()
            : undefined,
        }))
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchHearted()
  }, [fetchHearted])

  const handleUnsave = (id: string, hearted: boolean) => {
    if (!hearted) {
      // Remove from list when un-hearted
      setEvents((prev) => prev.filter((e) => e.id !== id))
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
          <Heart className="h-6 w-6 text-rose-600 dark:text-rose-400 fill-current" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Calendar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Events you&apos;ve saved to your personal collection
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-16 text-center">
          <Heart className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No saved events yet
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            Click the heart icon on any event to add it to your personal calendar collection.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Calendar className="h-4 w-4" />
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {events.length} saved event{events.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                {/* Date column */}
                <div className="flex-shrink-0 w-14 text-center">
                  <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    {format(parseISO(event.startDate), "MMM")}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {format(parseISO(event.startDate), "d")}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(event.startDate), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {event.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {event.url && (
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title="Visit event page"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <Link
                    href={`/dashboard/events/${event.id}`}
                    className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Details
                  </Link>
                  {event.id && (
                    <HeartButton
                      eventId={event.id}
                      initialHearted={true}
                      onToggle={(h) => handleUnsave(event.id!, h)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
