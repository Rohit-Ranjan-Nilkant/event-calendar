import { cache } from "react"
import { PlatformSettings, DEFAULT_PLATFORM } from "@/types"

// Server-side: call Express backend directly (internal Docker network / localhost).
// Never call this from client components — use the /api/platform/settings route via fetch instead.
const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:4000"

/**
 * Memoised per-request with React cache() so multiple server components
 * calling this in the same render tree share a single HTTP round-trip.
 */
export const getPlatformSettings = cache(async (): Promise<PlatformSettings> => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/platform/settings`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return DEFAULT_PLATFORM
    return res.json() as Promise<PlatformSettings>
  } catch {
    return DEFAULT_PLATFORM
  }
})

// Color palette map for the 6 preset themes
export const COLOR_THEMES: Record<string, {
  50: string; 100: string; 200: string; 300: string;
  400: string; 500: string; 600: string; 700: string;
  800: string; 900: string; 950: string;
}> = {
  indigo: {
    50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc",
    400: "#818cf8", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca",
    800: "#3730a3", 900: "#312e81", 950: "#1e1b4b",
  },
  blue: {
    50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd",
    400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8",
    800: "#1e40af", 900: "#1e3a8a", 950: "#172554",
  },
  emerald: {
    50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7",
    400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857",
    800: "#065f46", 900: "#064e3b", 950: "#022c22",
  },
  violet: {
    50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd",
    400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9",
    800: "#5b21b6", 900: "#4c1d95", 950: "#2e1065",
  },
  rose: {
    50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af",
    400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c",
    800: "#9f1239", 900: "#881337", 950: "#4c0519",
  },
  amber: {
    50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d",
    400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309",
    800: "#92400e", 900: "#78350f", 950: "#451a03",
  },
}
