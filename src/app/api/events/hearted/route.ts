import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json([])

  const saved = await prisma.userEvent.findMany({
    where: { userId: session.userId },
    select: { eventId: true },
  })

  return Response.json(saved.map((s) => s.eventId))
}
