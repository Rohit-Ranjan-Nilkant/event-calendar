import { NextRequest } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) return Response.json({ error: "Event not found" }, { status: 404 })
  return Response.json(event)
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
