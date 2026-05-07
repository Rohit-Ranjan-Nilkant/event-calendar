"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, List } from "lucide-react"

const navigation = [
  { name: "Calendar", href: "/dashboard", icon: Calendar },
  { name: "All Events", href: "/dashboard/events", icon: List },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-56 lg:border-r lg:border-gray-200 dark:lg:border-gray-800 lg:bg-white dark:lg:bg-gray-900">
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navigation.map((item) => {
          const active = pathname === item.href
          return (
            <Link key={item.name} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <item.icon className={`h-5 w-5 ${active ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"}`} />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
