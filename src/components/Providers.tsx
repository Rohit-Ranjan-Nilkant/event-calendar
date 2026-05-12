"use client"

import { Toaster } from "react-hot-toast"
import { ThemeProvider } from "./ThemeProvider"
import PlatformProvider from "./PlatformProvider"
import type { PlatformSettings } from "@/types"

interface ProvidersProps {
  children: React.ReactNode
  platformSettings?: PlatformSettings
}

export default function Providers({ children, platformSettings }: ProvidersProps) {
  return (
    <ThemeProvider>
      <PlatformProvider initial={platformSettings}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            className: "!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-white !border !border-gray-200 dark:!border-gray-700",
          }}
        />
      </PlatformProvider>
    </ThemeProvider>
  )
}
