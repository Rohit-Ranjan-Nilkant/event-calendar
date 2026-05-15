"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { Search, Filter, MapPin, Clock, ExternalLink, ChevronRight, CalendarClock, History, Globe } from "lucide-react"
import type { EventData } from "@/types"
import HeartButton from "@/components/HeartButton"
import { EventRowSkeleton } from "@/components/Skeleton"
import { useDebounce } from "@/hooks/useDebounce"

const CATEGORIES = ["all","General","Conference","Workshop","Webinar","Seminar","Meetup","Training","Award","Networking"]
const SOURCES    = ["all","manual","excel","url"]

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

export default function EventsPage() {
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]           = useState<"upcoming" | "past">("upcoming")
  const [category, setCategory] = useState("all")
  const [source, setSource]     = useState("all")
  const [search, setSearch]     = useState("")
  const [city, setCity]         = useState("")
  const [country, setCountry]   = useState("")

  const debouncedSearch  = useDebounce(search,  400)
  const debouncedCity    = useDebounce(city,    400)
  const debouncedCountry = useDebounce(country, 400)
  const isPast = tab === "past"

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (isPast)              params.set("archived", "true")
    if (category !== "all") params.set("category", category)
    if (source !== "all")   params.set("source", source)
    if (debouncedSearch)    params.set("search",  debouncedSearch)
    if (debouncedCity)      params.set("city",    debouncedCity)
    if (debouncedCountry)   params.set("country", debouncedCountry)

    const res = await fetch(`/api/events?${params}`)
    if (res.ok) {
      const data = await res.json()
      setEvents(
        data.map((e: Record<string, unknown>) => ({
          ...e,
          startDate: typeof e.startDate === "string"
            ? e.startDate
            : new Date(e.startDate as number).toISOString(),
          endDate: e.endDate
            ? typeof e.endDate === "string" ? e.endDate : new Date(e.endDate as number).toISOString()
            : undefined,
        }))
      )
    }
    setLoading(false)
  }, [isPast, category, source, debouncedSearch, debouncedCity, debouncedCountry])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  // Reset filters when switching tabs
  const switchTab = (next: "upcoming" | "past") => {
    setSearch("")
    setCategory("all")
    setSource("all")
    setCity("")
    setCountry("")
    setTab(next)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Events</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {loading ? "Loading…" : `${events.length} ${isPast ? "past" : "upcoming"} event${events.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        <button
          onClick={() => switchTab("upcoming")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            !isPast
              ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          <CalendarClock className="h-4 w-4" />
          Upcoming
        </button>
        <button
          onClick={() => switchTab("past")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            isPast
              ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          <History className="h-4 w-4" />
          Past Events
        </button>
      </div>

      {/* Filters — row 1: search + category + source */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${isPast ? "past" : "upcoming"} events…`}
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

      {/* Filters — row 2: city + country (geographical) */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by city…"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by country…"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        {(city || country) && (
          <button
            onClick={() => { setCity(""); setCountry("") }}
            className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
          >
            Clear location
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <EventRowSkeleton count={8} />
      ) : events.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <History className={`h-10 w-10 mx-auto mb-3 ${isPast ? "text-amber-300 dark:text-amber-700" : "text-gray-200 dark:text-gray-700"}`} />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {isPast ? "No past events found" : "No upcoming events found"}
          </p>
          {!isPast && (
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Check back later or view past events using the tab above.
            </p>
          )}
        </div>
      ) : (
        <div className={`bg-white dark:bg-gray-900 rounded-xl border divide-y transition-all ${
          isPast
            ? "border-amber-100 dark:border-amber-900/30 divide-amber-50 dark:divide-amber-900/20"
            : "border-gray-200 dark:border-gray-800 divide-gray-100 dark:divide-gray-800"
        }`}>
          {events.map((event) => (
            <div
              key={event.id}
              className={`flex items-start gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors ${
                isPast ? "opacity-75 hover:opacity-100" : ""
              }`}
            >
              {/* Date column */}
              <Link href={`/dashboard/events/${event.id}`}
                className={`flex-shrink-0 w-14 text-center pt-1 ${isPast ? "opacity-60" : ""}`}>
                <div className={`text-xs font-semibold uppercase ${
                  isPast ? "text-amber-600 dark:text-amber-500" : "text-indigo-600 dark:text-indigo-400"
                }`}>
                  {format(parseISO(event.startDate), "MMM")}
                </div>
                <div className={`text-2xl font-bold ${
                  isPast ? "text-gray-400 dark:text-gray-600" : "text-gray-900 dark:text-white"
                }`}>
                  {format(parseISO(event.startDate), "d")}
                </div>
              </Link>

              <Link href={`/dashboard/events/${event.id}`} className="flex-1 min-w-0 block">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`text-sm font-semibold transition-colors ${
                    isPast
                      ? "text-gray-500 dark:text-gray-400"
                      : "text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                  }`}>
                    {event.title}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full opacity-80 ${categoryColors[event.category || "General"] ?? categoryColors.General}`}>
                    {event.category}
                  </span>
                  {isPast && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                      past
                    </span>
                  )}
                </div>
                {event.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5 line-clamp-1">{event.description}</p>
                )}
                <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />{format(parseISO(event.startDate), "MMM d, yyyy h:mm a")}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                  )}
                  {event.url && (
                    <span className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400">
                      <ExternalLink className="h-3 w-3" />Link
                    </span>
                  )}
                </div>
              </Link>

              <div className="flex items-center gap-1 shrink-0 self-center">
                {!isPast && event.id && (
                  <HeartButton eventId={event.id} initialHearted={event.hearted} size="sm" />
                )}
                <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
