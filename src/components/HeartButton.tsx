"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import toast from "react-hot-toast"

interface HeartButtonProps {
  eventId: string
  initialHearted?: boolean
  size?: "sm" | "md"
  onToggle?: (hearted: boolean) => void
}

export default function HeartButton({
  eventId,
  initialHearted = false,
  size = "md",
  onToggle,
}: HeartButtonProps) {
  const [hearted, setHearted] = useState(initialHearted)
  const [loading, setLoading] = useState(false)

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}/heart`, { method: "POST" })
      if (res.status === 401) {
        toast.error("Sign in to save events")
        return
      }
      if (!res.ok) throw new Error("Request failed")
      const data = await res.json() as { hearted: boolean }
      setHearted(data.hearted)
      onToggle?.(data.hearted)
      toast.success(data.hearted ? "Added to My Calendar ♥" : "Removed from My Calendar")
    } catch {
      toast.error("Could not update saved events")
    } finally {
      setLoading(false)
    }
  }

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
  const btnSize = size === "sm" ? "p-1" : "p-1.5"

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={hearted ? "Remove from My Calendar" : "Save to My Calendar"}
      className={`${btnSize} rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-rose-400 ${
        hearted
          ? "text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50"
          : "text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <Heart
        className={`${iconSize} ${hearted ? "fill-current" : ""} transition-all`}
      />
    </button>
  )
}
