"use client"

import { useState, useEffect, use } from "react"
import EventForm from "@/components/EventForm"

export default function AdminEditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [event, setEvent] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/events/${id}`).then((r) => r.ok ? r.json() : null).then((d) => { setEvent(d); setLoading(false) })
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
  if (!event) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Event not found</div>

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Event</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update the event details below</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <EventForm
          eventId={id}
          redirectTo="/admin/events"
          initialData={{
            title: event.title as string,
            description: (event.description as string) || "",
            startDate: event.startDate as string,
            endDate: (event.endDate as string) || "",
            location: (event.location as string) || "",
            url: (event.url as string) || "",
            category: (event.category as string) || "General",
            organizer: (event.organizer as string) || "",
            isAllDay: (event.isAllDay as boolean) || false,
          }}
        />
      </div>
    </div>
  )
}
