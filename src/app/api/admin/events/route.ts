import { NextRequest } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  await requireAdmin()

  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get("category")
  const search = searchParams.get("search")
  const source = searchParams.get("source")

  const where: Record<string, unknown> = {}
  if (category && category !== "all") where.category = category
  if (source && source !== "all") where.source = source
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { location: { contains: search } },
    ]
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { startDate: "asc" },
    include: { user: { select: { name: true, email: true } } },
  })

  return Response.json(events)
}
