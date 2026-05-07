import { redirect } from "next/navigation"

// Event creation is admin-only — redirect to admin panel
export default function NewEventPage() {
  redirect("/admin/events/new")
}
