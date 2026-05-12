"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  ExternalLink,
  X,
} from "lucide-react"
import type { EventData, CalendarView } from "@/types"
import HeartButton from "./HeartButton"

interface CalendarProps {
  events: EventData[]
}

const categoryColors: Record<string, string> = {
  Conference: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  Workshop: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  Webinar: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  Seminar: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  Meetup: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800",
  Training: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  Award: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  Networking: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800",
  General: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
}

function getCategoryColor(category?: string) {
  return categoryColors[category || "General"] || categoryColors.General
}

export default function EventCalendar({ events }: CalendarProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>("month")
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null)

  const navigateBack = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1))
    else if (view === "week") setCurrentDate(subWeeks(currentDate, 1))
  }

  const navigateForward = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1))
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1))
  }

  const days = useMemo(() => {
    if (view === "month") {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      return eachDayOfInterval({
        start: startOfWeek(monthStart),
        end: endOfWeek(monthEnd),
      })
    }
    return eachDayOfInterval({
      start: startOfWeek(currentDate),
      end: endOfWeek(currentDate),
    })
  }, [currentDate, view])

  const getEventsForDay = (date: Date) =>
    events.filter((event) => isSameDay(parseISO(event.startDate), date))

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [events]
  )

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {view === "month"
              ? format(currentDate, "MMMM yyyy")
              : view === "week"
                ? `Week of ${format(startOfWeek(currentDate), "MMM d, yyyy")}`
                : format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={navigateBack} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
            >
              Today
            </button>
            <button onClick={navigateForward} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {(["month", "week", "list"] as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                view === v
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      {view !== "list" ? (
        <div className="p-4">
          <div className="grid grid-cols-7 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className={`grid grid-cols-7 ${view === "week" ? "" : "auto-rows-[120px]"}`}>
            {days.map((day) => {
              const dayEvents = getEventsForDay(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const todayCheck = isToday(day)

              return (
                <div
                  key={day.toISOString()}
                  className={`border border-gray-100 dark:border-gray-800 p-1.5 ${
                    view === "week" ? "min-h-[200px]" : ""
                  } ${!isCurrentMonth && view === "month" ? "bg-gray-50 dark:bg-gray-900/50" : ""}`}
                >
                  <div
                    className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                      todayCheck
                        ? "bg-indigo-600 text-white"
                        : isCurrentMonth
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-400 dark:text-gray-600"
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={`w-full text-left text-xs px-1.5 py-0.5 rounded truncate border ${getCategoryColor(event.category)} transition-opacity hover:opacity-80`}
                      >
                        {event.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 pl-1.5">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* List view */
        <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[600px] overflow-y-auto">
          {sortedEvents.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
              No events found
            </div>
          ) : (
            sortedEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <button
                  onClick={() => setSelectedEvent(event)}
                  className="flex-shrink-0 w-14 text-center"
                >
                  <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    {format(parseISO(event.startDate), "MMM")}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {format(parseISO(event.startDate), "d")}
                  </div>
                </button>
                <button
                  onClick={() => setSelectedEvent(event)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {event.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(event.category)}`}>
                      {event.category}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 truncate">
                      {event.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 dark:text-gray-500">
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {event.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(event.startDate), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                </button>
                {event.id && (
                  <div className="shrink-0 self-center">
                    <HeartButton eventId={event.id} initialHearted={event.hearted} size="sm" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden border border-gray-200 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-start">
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-snug">
                  {selectedEvent.title}
                </h3>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full border mt-1.5 ${getCategoryColor(selectedEvent.category)}`}>
                  {selectedEvent.category}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {selectedEvent.id && (
                  <HeartButton eventId={selectedEvent.id} initialHearted={selectedEvent.hearted} />
                )}
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="px-6 py-4 space-y-3">
              {selectedEvent.description && (
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedEvent.description}
                </p>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
                  <span>
                    {format(parseISO(selectedEvent.startDate), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                    {selectedEvent.endDate &&
                      ` – ${format(parseISO(selectedEvent.endDate), "MMMM d, yyyy 'at' h:mm a")}`}
                  </span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.organizer && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <span className="text-gray-400 dark:text-gray-500 font-medium">Organizer:</span>
                    <span>{selectedEvent.organizer}</span>
                  </div>
                )}
                {selectedEvent.tags && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedEvent.tags.split(",").map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
              {selectedEvent.url && (
                <a
                  href={selectedEvent.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit Event Page
                </a>
              )}
              <button
                onClick={() => router.push(`/dashboard/events/${selectedEvent.id}`)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium rounded-lg transition-colors"
              >
                View Details
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="ml-auto px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
