"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Loader2 } from "lucide-react"

export default function RegisterForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const form = e.currentTarget
    const name     = (form.elements.namedItem("name")     as HTMLInputElement).value.trim()
    const email    = (form.elements.namedItem("email")    as HTMLInputElement).value.trim().toLowerCase()
    const password = (form.elements.namedItem("password") as HTMLInputElement).value
    const confirm  = (form.elements.namedItem("confirm")  as HTMLInputElement).value

    // Client-side validation
    const fe: Record<string, string> = {}
    if (!name) fe.name = "Name is required"
    if (!email || !email.includes("@")) fe.email = "Valid email required"
    if (!password || password.length < 8) fe.password = "Password must be at least 8 characters"
    if (password !== confirm) fe.confirm = "Passwords do not match"
    if (Object.keys(fe).length > 0) { setFieldErrors(fe); return }

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name, email, password }),
        })
        const data = await res.json() as { error?: string; fieldErrors?: Record<string, string> }
        if (!res.ok) {
          if (data.fieldErrors) setFieldErrors(data.fieldErrors)
          else setError(data.error ?? "Registration failed")
          return
        }
        router.push("/dashboard")
        router.refresh()
      } catch {
        setError("Network error — please try again")
      }
    })
  }

  const fe = fieldErrors

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="DS EventHub" width={72} height={72} className="object-contain mb-3" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">DS EventHub</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create your account</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full name</label>
              <input
                name="name" type="text" autoComplete="name" required
                className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="Jane Smith"
              />
              {fe.name && <p className="mt-1 text-xs text-red-600">{fe.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
              <input
                name="email" type="email" autoComplete="email" required
                className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="you@example.com"
              />
              {fe.email && <p className="mt-1 text-xs text-red-600">{fe.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <input
                name="password" type="password" autoComplete="new-password" required
                className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="Min. 8 characters"
              />
              {fe.password && <p className="mt-1 text-xs text-red-600">{fe.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm password</label>
              <input
                name="confirm" type="password" autoComplete="new-password" required
                className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="••••••••"
              />
              {fe.confirm && <p className="mt-1 text-xs text-red-600">{fe.confirm}</p>}
            </div>

            <button
              type="submit" disabled={isPending}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors mt-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
