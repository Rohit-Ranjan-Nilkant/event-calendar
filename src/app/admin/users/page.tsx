"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Shield, User, Trash2, RefreshCw, Star } from "lucide-react"
import toast from "react-hot-toast"

interface UserRow {
  id: string
  email: string
  name?: string | null
  role: string
  createdAt: string
  _count?: { events: number }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [currentUserRole, setCurrentUserRole] = useState<string>("")

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { if (d) { setCurrentUserId(d.userId); setCurrentUserRole(d.role) } })
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    const res = await fetch("/api/admin/users")
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  /** Cycle: USER → ADMIN → SUPER_ADMIN → USER */
  const cycleRole = async (id: string, currentRole: string) => {
    const next =
      currentRole === "USER"        ? "ADMIN" :
      currentRole === "ADMIN"       ? "SUPER_ADMIN" :
      /* SUPER_ADMIN */                "USER"
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: next }),
    })
    if (res.ok) {
      toast.success(`Role updated to ${next}`)
      setUsers(users.map(u => u.id === id ? { ...u, role: next } : u))
    } else {
      toast.error("Failed to update role")
    }
  }

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user and all their events?")) return
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("User deleted")
      setUsers(users.filter(u => u.id !== id))
    } else {
      toast.error("Failed to delete user")
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{users.length} registered users</p>
        </div>
        <button onClick={loadUsers} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">User</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Role</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Events</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Joined</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                          {(user.name ?? user.email)[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{user.name ?? "—"}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.role === "SUPER_ADMIN" ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                        <Star className="h-3 w-3" /> Super Admin
                      </span>
                    ) : user.role === "ADMIN" ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                        <Shield className="h-3 w-3" /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        <User className="h-3 w-3" /> User
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{user._count?.events ?? 0}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{format(parseISO(user.createdAt), "MMM d, yyyy")}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => cycleRole(user.id, user.role)}
                        disabled={
                          user.id === currentUserId ||
                          // Only SUPER_ADMIN can promote to/demote from SUPER_ADMIN
                          (user.role === "ADMIN" && currentUserRole !== "SUPER_ADMIN")
                        }
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title={
                          user.role === "USER"        ? "Promote to Admin" :
                          user.role === "ADMIN"       ? "Promote to Super Admin" :
                          /* SUPER_ADMIN */              "Demote to User"
                        }
                      >
                        {user.role === "ADMIN" ? <Star className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        disabled={user.id === currentUserId}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
