import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json(null)

  // Pull the latest image from DB so avatar updates show immediately
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { image: true },
  })

  return Response.json({
    userId: session.userId,
    email: session.email,
    role: session.role,
    name: session.name,
    image: user?.image ?? null,
  })
}
