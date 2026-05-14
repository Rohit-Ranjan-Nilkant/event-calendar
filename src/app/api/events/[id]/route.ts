import { NextRequest } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) return Response.json({ error: "Event not found" }, { status: 404 })

  // Annotate with hearted status for current user
  const session = await getSession()
  let hearted = false
  if (session) {
    const saved = await prisma.userEvent.findUnique({
      where: { userId_eventId: { userId: session.userId, eventId: id } },
    })
    hearted = !!saved
  }

  return Response.json({ ...event, hearted })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin()
  const { id } = await params
  const body = await request.json()

  const existing = await prisma.event.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: "Event not found" }, { status: 404 })

  const event = await prisma.event.update({
    where: { id },
    data: {
      title: body.title ?? existing.title,
      description: body.description ?? existing.description,
      startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
      endDate: body.endDate ? new Date(body.endDate) : existing.endDate,
      location: body.location ?? existing.location,
      url: body.url ?? existing.url,
      category: body.category ?? existing.category,
      organizer: body.organizer ?? existing.organizer,
      isAllDay: body.isAllDay ?? existing.isAllDay,
    },
  })

  return Response.json(event)
}

/** PATCH — admin-only partial update, used to restore an archived event */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin()
  const { id } = await params
  const body = await request.json()

  const existing = await prisma.event.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: "Event not found" }, { status: 404 })

  const data: Record<string, unknown> = {}
  if (typeof body.archived === "boolean") {
    data.archived   = body.archived
    data.archivedAt = body.archived ? (existing.archivedAt ?? new Date()) : null
  }

  const event = await prisma.event.update({ where: { id }, data })
  return Response.json(event)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin()
  const { id } = await params
  const existing = await prisma.event.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: "Event not found" }, { status: 404 })
  await prisma.event.delete({ where: { id } })
  return Response.json({ success: true })
}
