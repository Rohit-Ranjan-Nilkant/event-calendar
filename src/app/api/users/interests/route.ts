import { NextRequest } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json([])

  const interests = await prisma.userInterest.findMany({
    where: { userId: session.userId },
    select: { interest: true },
  })

  return Response.json(interests.map((i) => i.interest))
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { interests } = await request.json() as { interests: string[] }

  await prisma.userInterest.deleteMany({ where: { userId: session.userId } })

  if (interests?.length) {
    await prisma.userInterest.createMany({
      data: interests.map((interest) => ({
        userId: session.userId,
        interest,
      })),
      skipDuplicates: true,
    })
  }

  return Response.json({ saved: interests?.length ?? 0 })
}
