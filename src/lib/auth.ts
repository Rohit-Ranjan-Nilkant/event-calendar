import { compare, hash } from "bcryptjs"
import { redirect } from "next/navigation"
import { getSession } from "./session"

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, 12)
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return compare(plain, hashed)
}

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
