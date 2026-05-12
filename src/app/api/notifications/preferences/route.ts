import { NextRequest } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json(null)

  const pref = await prisma.notificationPreference.findUnique({
    where: { userId: session.userId },
  })

  return Response.json(pref)
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()

  const pref = await prisma.notificationPreference.upsert({
    where: { userId: session.userId },
    update: {
      channel: body.channel ?? "email",
      target: body.target ?? "",
      remindBefore: Number(body.remindBefore) || 24,
      enabled: body.enabled ?? true,
    },
    create: {
      userId: session.userId,
      channel: body.channel ?? "email",
      target: body.target ?? "",
      remindBefore: Number(body.remindBefore) || 24,
      enabled: body.enabled ?? true,
    },
  })

  return Response.json(pref)
}
