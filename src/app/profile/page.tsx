"use client"

import { useState, useEffect } from "react"
import {
  User, Bell, Heart, Save, Loader2, Check, TestTube2,
  Mail, MessageSquare, Hash, Webhook
} from "lucide-react"
import toast from "react-hot-toast"
import { INTERESTS } from "@/lib/interests"
import type { NotificationPreference } from "@/types"

const CHANNELS = [
  { value: "email", label: "Email", icon: Mail, placeholder: "you@example.com" },
  { value: "slack", label: "Slack Webhook", icon: Hash, placeholder: "https://hooks.slack.com/services/..." },
  { value: "discord", label: "Discord Webhook", icon: MessageSquare, placeholder: "https://discord.com/api/webhooks/..." },
  { value: "webhook", label: "Custom Webhook", icon: Webhook, placeholder: "https://your-server.com/hook" },
]

export default function ProfilePage() {
  // ── Interests ─────────────────────────────────────────────────────────────
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [savingInterests, setSavingInterests] = useState(false)
  const [loadingInterests, setLoadingInterests] = useState(true)

  // ── Notifications ─────────────────────────────────────────────────────────
  const [pref, setPref] = useState<Partial<NotificationPreference>>({
    channel: "email",
    target: "",
    remindBefore: 24,
    enabled: true,
  })
  const [savingPref, setSavingPref] = useState(false)
  const [testingPref, setTestingPref] = useState(false)
  const [loadingPref, setLoadingPref] = useState(true)

  useEffect(() => {
    fetch("/api/users/interests")
      .then((r) => r.json())
      .then((d: string[]) => setSelectedInterests(d ?? []))
      .catch(() => {})
      .finally(() => setLoadingInterests(false))

    fetch("/api/notifications/preferences")
      .then((r) => r.json())
      .then((d: NotificationPreference | null) => {
        if (d) setPref(d)
      })
      .catch(() => {})
      .finally(() => setLoadingPref(false))
  }, [])

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    )
  }

  const saveInterests = async () => {
    setSavingInterests(true)
    try {
      const res = await fetch("/api/users/interests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: selectedInterests }),
      })
      if (!res.ok) throw new Error("Save failed")
      toast.success("Interests saved!")
    } catch {
      toast.error("Failed to save interests")
    } finally {
      setSavingInterests(false)
    }
  }

  const savePref = async () => {
    setSavingPref(true)
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pref),
      })
      if (!res.ok) throw new Error("Save failed")
      toast.success("Notification preferences saved!")
    } catch {
      toast.error("Failed to save preferences")
    } finally {
      setSavingPref(false)
    }
  }

  const testNotification = async () => {
    if (!pref.target) { toast.error("Enter a target first"); return }
    setTestingPref(true)
    try {
      const res = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: pref.channel, target: pref.target }),
      })
      const data = await res.json() as { ok?: boolean; error?: string; note?: string }
      if (!res.ok) throw new Error(data.error || "Test failed")
      toast.success(data.note ?? "Test notification sent!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test failed")
    } finally {
      setTestingPref(false)
    }
  }

  const selectedChannel = CHANNELS.find((c) => c.value === pref.channel) ?? CHANNELS[0]

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          My Profile
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your interests and notification preferences.
        </p>
      </div>

      {/* ── Areas of interest ────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Areas of Interest</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">
          Select topics you care about to personalise your Discover feed.
        </p>

        {loadingInterests ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => {
              const selected = selectedInterests.includes(interest)
              return (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selected
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-indigo-400 dark:hover:border-indigo-500"
                  }`}
                >
                  {selected && <Check className="h-3.5 w-3.5" />}
                  {interest}
                </button>
              )
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {selectedInterests.length} interest{selectedInterests.length !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={saveInterests}
            disabled={savingInterests}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {savingInterests ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Interests
          </button>
        </div>
      </section>

      {/* ── Notification preferences ─────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">
          Choose how you&apos;d like to be reminded about upcoming events.
        </p>

        {loadingPref ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Enable toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable notifications</span>
              <label className="relative cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={pref.enabled ?? true}
                  onChange={(e) => setPref((p) => ({ ...p, enabled: e.target.checked }))}
                />
                <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 peer-checked:bg-indigo-600 rounded-full transition-colors" />
                <div className="absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow" />
              </label>
            </div>

            {/* Channel selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notification channel
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CHANNELS.map((ch) => {
                  const Icon = ch.icon
                  const active = pref.channel === ch.value
                  return (
                    <button
                      key={ch.value}
                      onClick={() => setPref((p) => ({ ...p, channel: ch.value as NotificationPreference["channel"] }))}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        active
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {ch.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Target input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {selectedChannel.label} address / URL
              </label>
              <input
                type="text"
                value={pref.target ?? ""}
                onChange={(e) => setPref((p) => ({ ...p, target: e.target.value }))}
                placeholder={selectedChannel.placeholder}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
              />
            </div>

            {/* Remind before */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Remind me before the event
              </label>
              <select
                value={pref.remindBefore ?? 24}
                onChange={(e) => setPref((p) => ({ ...p, remindBefore: Number(e.target.value) }))}
                className="w-48 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                {[1, 2, 4, 8, 12, 24, 48, 72].map((h) => (
                  <option key={h} value={h}>
                    {h < 24 ? `${h} hour${h !== 1 ? "s" : ""}` : `${h / 24} day${h / 24 !== 1 ? "s" : ""}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={savePref}
                disabled={savingPref}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {savingPref ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Preferences
              </button>
              <button
                onClick={testNotification}
                disabled={testingPref || !pref.target}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {testingPref ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube2 className="h-4 w-4" />}
                Send Test
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
