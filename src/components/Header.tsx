"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, LogIn, LogOut, Shield, User, Heart, Compass } from "lucide-react"
import { useState, useEffect } from "react"
import ThemeToggle from "./ThemeToggle"
import { usePlatform } from "./PlatformProvider"

interface SessionInfo {
  userId: string
  email: string
  role: string
  name?: string
}

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const platform = usePlatform()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [session, setSession] = useState<SessionInfo | null | undefined>(undefined)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(setSession)
      .catch(() => setSession(null))
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setSession(null)
    router.push("/login")
    router.refresh()
  }

  const isAdmin = session?.role === "ADMIN"

  const publicLinks = [
    { name: "Calendar", href: "/dashboard" },
    { name: "Events", href: "/dashboard/events" },
    { name: "Discover", href: "/dashboard/discover", icon: Compass },
    { name: "My Calendar", href: "/dashboard/my-calendar", icon: Heart },
  ]

  const navLinks = isAdmin
    ? [...publicLinks, { name: "Admin", href: "/admin/events", icon: Shield }]
    : publicLinks

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo + nav */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              {platform.logoUrl ? (
                <Image src={platform.logoUrl} alt={platform.platformName} width={36} height={36} className="object-contain" />
              ) : (
                <Image src="/logo.png" alt={platform.platformName} width={36} height={36} className="object-contain" />
              )}
              <span className="text-base font-bold text-gray-900 dark:text-white hidden sm:block">
                {platform.platformName}
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const active =
                  pathname === link.href ||
                  (link.href !== "/dashboard" && pathname.startsWith(link.href))
                const Icon = "icon" in link ? link.icon : undefined
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      active
                        ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {link.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {session === undefined ? null : session ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 max-w-32 truncate">
                    {session.name ?? session.email}
                  </span>
                  {isAdmin && (
                    <span className="text-xs px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded font-medium">
                      Admin
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <LogIn className="h-4 w-4" /> Sign in
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            const active = pathname === link.href
            const Icon = "icon" in link ? link.icon : undefined
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  active
                    ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {link.name}
              </Link>
            )
          })}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            {session ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                >
                  Profile ({session.name ?? session.email})
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
