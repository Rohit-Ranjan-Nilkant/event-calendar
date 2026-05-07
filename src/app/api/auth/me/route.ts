import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return Response.json(null)
  }
  return Response.json({
    userId: session.userId,
    email: session.email,
    role: session.role,
    name: session.name,
  })
}
