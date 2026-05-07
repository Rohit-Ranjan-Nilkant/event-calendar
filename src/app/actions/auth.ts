"use server"

import { prisma } from "@/lib/prisma"
import { hashPassword, verifyPassword } from "@/lib/auth"
import { createSession, destroySession } from "@/lib/session"
import { redirect } from "next/navigation"

export interface ActionState {
  error?: string
  fieldErrors?: Record<string, string>
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.password) {
    return { error: "Invalid email or password" }
  }

  const valid = await verifyPassword(password, user.password)
  if (!valid) {
    return { error: "Invalid email or password" }
  }

  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name ?? undefined,
  })

  redirect(user.role === "ADMIN" ? "/admin/events" : "/dashboard")
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = (formData.get("name") as string)?.trim()
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const password = formData.get("password") as string
  const confirm = formData.get("confirm") as string

  const fieldErrors: Record<string, string> = {}
  if (!name) fieldErrors.name = "Name is required"
  if (!email || !email.includes("@")) fieldErrors.email = "Valid email required"
  if (!password || password.length < 8) fieldErrors.password = "Password must be at least 8 characters"
  if (password !== confirm) fieldErrors.confirm = "Passwords do not match"

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { fieldErrors: { email: "Email already registered" } }
  }

  const hashed = await hashPassword(password)
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: "USER" },
  })

  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name ?? undefined,
  })

  redirect("/dashboard")
}

export async function logoutAction(): Promise<void> {
  await destroySession()
  redirect("/login")
}
