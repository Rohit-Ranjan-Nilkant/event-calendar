"use client"

import { useState, useEffect, useCallback } from "react"
import { Compass, MapPin, Clock, ExternalLink, Settings2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import Link from "next/link"
import HeartButton from "@/components/HeartButton"
import { EventRowSkeleton } from "@/components/Skeleton"
import type { EventData } from "@/types"
import { INTERESTS } from "@/lib/interests"

export default function DiscoverPage() {
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)
  const [userInterests, setUserInterests] = useState<string[]>([])

  const fetchDiscover = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/events?discover=true")
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
    fetch("/api/users/interests")
      .then((r) => r.json())
      .then((d: string[]) => setUserInterests(d ?? []))
      .catch(() => {})
    fetchDiscover()
  }, [fetchDiscover])

  const categoryColors: Record<string, string> = {
    Conference: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Workshop: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    Webinar: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    General: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  }
  const getCat = (c?: string) => categoryColors[c || "General"] || categoryColors.General

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <Compass className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Discover</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Events matched to your interests
            </p>
          </div>
        </div>
        <Link
          href="/profile"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Settings2 className="h-4 w-4" />
          Edit Interests
        </Link>
      </div>

      {/* Interest tags */}
      {userInterests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {userInterests.map((interest) => (
            <span
              key={interest}
              className="text-xs px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800 font-medium"
            >
              {interest}
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <EventRowSkeleton count={5} />
      ) : userInterests.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-16 text-center">
          <Compass className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Set your interests
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            Choose the topics you care about and we&apos;ll surface matching events here automatically.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6 max-w-lg mx-auto">
            {INTERESTS.slice(0, 8).map((i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                {i}
              </span>
            ))}
            <span className="text-xs px-2.5 py-1 text-gray-400">+{INTERESTS.length - 8} more</span>
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Settings2 className="h-4 w-4" />
            Choose Interests
          </Link>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-16 text-center">
          <Compass className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No matching events found
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No events match your current interests. Try importing more events or broadening your interests.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {events.length} event{events.length !== 1 ? "s" : ""} matching your interests
            </span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex-shrink-0 w-14 text-center">
                  <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    {format(parseISO(event.startDate), "MMM")}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {format(parseISO(event.startDate), "d")}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {event.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getCat(event.category)}`}>
                      {event.category}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  {event.tags && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {event.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
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

                <div className="flex items-center gap-2 shrink-0">
                  {event.url && (
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {event.id && (
                    <HeartButton eventId={event.id} initialHearted={event.hearted} />
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
