"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, List, PlusCircle, Database, Users, Settings } from "lucide-react"

const navigation = [
  { name: "Dashboard",  href: "/admin/events",     icon: LayoutDashboard },
  { name: "All Events", href: "/admin/events/list", icon: List },
  { name: "Add Event",  href: "/admin/events/new",  icon: PlusCircle },
  { name: "Fetch Data", href: "/admin/upload",      icon: Database },
  { name: "Users",      href: "/admin/users",       icon: Users },
  { name: "Settings",   href: "/admin/settings",    icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-gray-200 dark:lg:border-gray-800 lg:bg-gray-50 dark:lg:bg-gray-900/50">
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Admin Panel</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navigation.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/admin/events" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <item.icon
                className={`h-5 w-5 ${active ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"}`}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
