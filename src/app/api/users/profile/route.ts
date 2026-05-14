import { NextRequest } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, image: true },
  })
  if (!user) return Response.json({ error: "User not found" }, { status: 404 })

  return Response.json(user)
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json() as { name?: string }
  const name = typeof body.name === "string" ? body.name.trim() : undefined

  if (name !== undefined && name.length === 0) {
    return Response.json({ error: "Name cannot be empty" }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { ...(name !== undefined ? { name } : {}) },
    select: { id: true, name: true, email: true, image: true },
  })

  return Response.json(user)
}
