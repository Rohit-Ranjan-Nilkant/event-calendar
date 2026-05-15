"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { ArrowLeft, Calendar, MapPin, ExternalLink, Clock, Tag, User, Globe } from "lucide-react"
import HeartButton from "@/components/HeartButton"

interface EventDetail {
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
  sourceUrl?: string | null
  isAllDay?: boolean
  tags?: string
  hearted?: boolean
}

/** Decode HTML entities and strip any residual tags so stored descriptions render cleanly. */
function cleanDescription(raw: string): string {
  return raw
    // Named entities
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&hellip;/g, "…").replace(/&mdash;/g, "—").replace(/&ndash;/g, "–")
    .replace(/&laquo;/g, "«").replace(/&raquo;/g, "»").replace(/&copy;/g, "©")
    // Numeric entities (decimal + hex)
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(+c))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, c) => String.fromCharCode(parseInt(c, 16)))
    // Strip any HTML tags that became visible after decoding
    .replace(/<[^>]*>/g, "")
    // Normalize whitespace while preserving paragraph breaks
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Extract the hostname from a URL for display, stripping www. prefix. */
function safeHostname(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, "") } catch { return url }
}

const categoryColors: Record<string, string> = {
  Conference: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Workshop: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Webinar: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  Seminar: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  Meetup: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  Training: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  Award: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  Networking: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  General: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setEvent(d); setLoading(false) })
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">Event not found</p>
        <Link href="/dashboard/events" className="text-indigo-600 hover:text-indigo-800 font-medium">← Back to events</Link>
      </div>
    )
  }

  const startDt = parseISO(event.startDate)
  const endDt = event.endDate ? parseISO(event.endDate) : null
  const colorClass = categoryColors[event.category ?? "General"] ?? categoryColors.General

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/dashboard/events" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to events
      </Link>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Date banner */}
        <div className="bg-indigo-600 dark:bg-indigo-700 px-8 py-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium opacity-80 uppercase tracking-wider mb-1">
                {format(startDt, "EEEE")}
              </div>
              <div className="text-4xl font-bold">{format(startDt, "d")}</div>
              <div className="text-xl font-medium opacity-90">{format(startDt, "MMMM yyyy")}</div>
            </div>
            <div className="flex items-center gap-3">
              {event.category && (
                <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${colorClass}`}>
                  {event.category}
                </span>
              )}
              <div className="bg-white/10 rounded-full">
                <HeartButton eventId={event.id} initialHearted={event.hearted} />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{event.title}</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Date & Time</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {event.isAllDay ? format(startDt, "MMMM d, yyyy") : format(startDt, "MMM d, yyyy · h:mm a")}
                </div>
                {endDt && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    to {event.isAllDay ? format(endDt, "MMMM d, yyyy") : format(endDt, "MMM d, yyyy · h:mm a")}
                  </div>
                )}
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Location</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{event.location}</div>
                </div>
              </div>
            )}

            {event.organizer && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Organizer</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{event.organizer}</div>
                </div>
              </div>
            )}

            {(event.source || event.sourceUrl) && (
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Source</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {event.source === "url" ? "Web import"
                      : event.source === "excel" ? "Excel import"
                      : event.source === "manual" ? "Manual entry"
                      : event.source ?? "Unknown"}
                  </div>
                  {event.sourceUrl && (
                    <a
                      href={event.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {safeHostname(event.sourceUrl)}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {event.tags && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Topics</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {event.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                  <span key={tag} className="text-xs px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {event.description && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Description</span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{cleanDescription(event.description)}</p>
              </div>
            </div>
          )}

          {event.url && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Visit Event Page
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Calendar add prompt */}
      <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">Want to browse more events?</span>
        </div>
        <Link href="/dashboard" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 font-medium whitespace-nowrap">
          View Calendar →
        </Link>
      </div>
    </div>
  )
}
