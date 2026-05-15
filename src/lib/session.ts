// Frontend-only: reads & verifies the JWT cookie set by the Express backend.
// The backend is the only service that creates/destroys sessions.
import { jwtVerify } from "jose"
import { cookies } from "next/headers"

const COOKIE_NAME = "ds-eventhub-session"

export interface SessionPayload {
  userId: string
  email: string
  role: string
  name?: string
}

function getSecret() {
  const secret = process.env.SESSION_SECRET || "ds-eventhub-fallback-secret-32ch"
  return new TextEncoder().encode(secret)
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}
