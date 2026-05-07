import EventForm from "@/components/EventForm"

export default function AdminNewEventPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Event</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Fill in the details to add a new event</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <EventForm redirectTo="/admin/events" />
      </div>
    </div>
  )
}
