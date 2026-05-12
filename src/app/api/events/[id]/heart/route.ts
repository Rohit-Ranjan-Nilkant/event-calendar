import { NextRequest } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id: eventId } = await params

  const existing = await prisma.userEvent.findUnique({
    where: { userId_eventId: { userId: session.userId, eventId } },
  })

  if (existing) {
    await prisma.userEvent.delete({ where: { id: existing.id } })
    return Response.json({ hearted: false })
  } else {
    await prisma.userEvent.create({
      data: { userId: session.userId, eventId },
    })
    return Response.json({ hearted: true })
  }
}
