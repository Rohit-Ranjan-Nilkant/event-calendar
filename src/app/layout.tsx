import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Providers from "@/components/Providers"
import { getPlatformSettings } from "@/lib/platform"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettings()
  return {
    title: settings.platformName,
    description: `Aggregate, manage, and share events — powered by ${settings.platformName}.`,
    icons: { icon: settings.logoUrl ?? "/logo.png" },
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const platformSettings = await getPlatformSettings()

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head />
      <body className="min-h-full flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
        {/* Anti-flash: apply saved theme before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ds-theme')||'light';if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
        <Providers platformSettings={platformSettings}>{children}</Providers>
      </body>
    </html>
  )
}
