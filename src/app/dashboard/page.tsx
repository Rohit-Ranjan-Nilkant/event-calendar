"use client"

import { useState, useEffect, useCallback } from "react"
import EventCalendar from "@/components/Calendar"
import { Search, Filter } from "lucide-react"
import type { EventData } from "@/types"

const CATEGORIES = [
  "all",
  "General",
  "Conference",
  "Workshop",
  "Webinar",
  "Seminar",
  "Meetup",
  "Training",
  "Award",
  "Networking",
]

export default function Dashboard() {
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState("all")
  const [search, setSearch] = useState("")

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category !== "all") params.set("category", category)
    if (search) params.set("search", search)

    const res = await fetch(`/api/events?${params}`)
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
  }, [category, search])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Event Calendar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {events.length} events total
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchEvents()}
              className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64 placeholder-gray-400"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="pl-9 pr-8 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <EventCalendar events={events} />
      )}
    </div>
  )
}
