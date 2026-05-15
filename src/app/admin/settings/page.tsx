"use client"

import { useState, useEffect } from "react"
import { Save, Loader2, Check, Palette, Globe, FileText, Image as ImageIcon } from "lucide-react"
import toast from "react-hot-toast"
import type { PlatformSettings } from "@/types"

const COLOR_OPTIONS = [
  { value: "indigo", label: "Indigo", hex: "#4f46e5" },
  { value: "blue", label: "Blue", hex: "#2563eb" },
  { value: "emerald", label: "Emerald", hex: "#059669" },
  { value: "violet", label: "Violet", hex: "#7c3aed" },
  { value: "rose", label: "Rose", hex: "#e11d48" },
  { value: "amber", label: "Amber", hex: "#d97706" },
]

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Omit<PlatformSettings, "id">>({
    platformName: "DS EventHub",
    logoUrl: null,
    primaryColor: "indigo",
    privacyPolicyUrl: null,
    termsUrl: null,
    customPrivacyText: null,
    customTermsText: null,
  })

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((s: PlatformSettings) => {
        if (s?.id) {
          setForm({
            platformName: s.platformName,
            logoUrl: s.logoUrl,
            primaryColor: s.primaryColor,
            privacyPolicyUrl: s.privacyPolicyUrl,
            termsUrl: s.termsUrl,
            customPrivacyText: s.customPrivacyText,
            customTermsText: s.customTermsText,
          })
        }
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Save failed")
      toast.success("Settings saved!")
      // Reload to reflect new platform name/colour
      setTimeout(() => window.location.reload(), 800)
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const set = (key: keyof typeof form, value: string | null) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Customise the platform name, branding, and legal pages.
        </p>
      </div>

      {/* ── Branding ─────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Globe className="h-5 w-5 text-gray-400" /> Branding
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Platform Name
          </label>
          <input
            type="text"
            value={form.platformName}
            onChange={(e) => set("platformName", e.target.value)}
            placeholder="Leave blank to hide the app name"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-xs text-gray-400 mt-1">Leave blank to hide the platform name everywhere (logo only)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <span className="flex items-center gap-1"><ImageIcon className="h-4 w-4" /> Logo URL</span>
          </label>
          <input
            type="url"
            value={form.logoUrl ?? ""}
            onChange={(e) => set("logoUrl", e.target.value || null)}
            placeholder="https://example.com/logo.png"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-xs text-gray-400 mt-1">Leave blank to use the default DS logo</p>
        </div>
      </section>

      {/* ── Theme colour ──────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Palette className="h-5 w-5 text-gray-400" /> Primary Colour
        </h2>
        <div className="flex flex-wrap gap-3">
          {COLOR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => set("primaryColor", opt.value)}
              title={opt.label}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                form.primaryColor === opt.value
                  ? "border-gray-900 dark:border-white shadow-sm"
                  : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <span
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: opt.hex }}
              />
              {opt.label}
              {form.primaryColor === opt.value && (
                <Check className="h-3.5 w-3.5 text-gray-700 dark:text-gray-200" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ── Legal ─────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-400" /> Legal Pages
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Privacy Policy URL
          </label>
          <input
            type="url"
            value={form.privacyPolicyUrl ?? ""}
            onChange={(e) => set("privacyPolicyUrl", e.target.value || null)}
            placeholder="https://digitalsherpa.ai/privacy"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            If set, footer links here instead of the built-in /privacy page
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Custom Privacy Policy Text
          </label>
          <textarea
            rows={5}
            value={form.customPrivacyText ?? ""}
            onChange={(e) => set("customPrivacyText", e.target.value || null)}
            placeholder="Paste your privacy policy text here…"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Terms of Service URL
          </label>
          <input
            type="url"
            value={form.termsUrl ?? ""}
            onChange={(e) => set("termsUrl", e.target.value || null)}
            placeholder="https://digitalsherpa.ai/terms"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Custom Terms of Service Text
          </label>
          <textarea
            rows={5}
            value={form.customTermsText ?? ""}
            onChange={(e) => set("customTermsText", e.target.value || null)}
            placeholder="Paste your terms of service text here…"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
          />
        </div>
      </section>

      {/* ── Save ─────────────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </button>
      </div>
    </div>
  )
}
