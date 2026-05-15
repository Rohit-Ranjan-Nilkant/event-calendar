// Frontend-only auth helpers — no Prisma, no bcrypt.
// All password operations and session creation live in the Express backend.
import { redirect } from "next/navigation"
import { getSession } from "./session"

export async function requireSession() {
  const session = await getSession()
  if (!session) redirect("/login")
  return session
}

/** Allow both ADMIN and SUPER_ADMIN to access the admin panel */
export async function requireAdmin() {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) redirect("/login")
  return session
}

/** Only SUPER_ADMIN may call this */
export async function requireSuperAdmin() {
  const session = await getSession()
  if (!session || session.role !== "SUPER_ADMIN") redirect("/login")
  return session
}

export async function getOptionalSession() {
  return getSession()
}
