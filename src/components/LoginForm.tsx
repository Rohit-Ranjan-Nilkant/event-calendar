"use client"

import { useActionState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { loginAction, type ActionState } from "@/app/actions/auth"

const initialState: ActionState = {}

interface LoginFormProps {
  platformName?: string
  logoUrl?: string
}

export default function LoginForm({
  platformName = "DS EventHub",
  logoUrl = "/logo.png",
}: LoginFormProps) {
  const [state, action, pending] = useActionState(loginAction, initialState)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image src={logoUrl} alt={platformName} width={72} height={72} className="object-contain mb-3" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{platformName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
          {state.error && (
            <div className="mb-5 px-4 py-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email address
              </label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
