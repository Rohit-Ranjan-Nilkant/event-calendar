import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseExcelBuffer } from "@/lib/excel-parser"

export async function POST(request: Request) {
  const session = await requireAdmin()

  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) return Response.json({ error: "No file provided" }, { status: 400 })

  const allowedExtensions = [".xlsx", ".xls", ".csv"]
  if (!allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))) {
    return Response.json({ error: "Invalid file type. Please upload .xlsx, .xls, or .csv" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const parsed = parseExcelBuffer(buffer)

  let imported = 0, skipped = 0

  for (const event of parsed) {
    if (!event.title || !event.startDate) { skipped++; continue }
    await prisma.event.create({
      data: {
        title: event.title,
        description: event.description || null,
        startDate: new Date(event.startDate),
        endDate: event.endDate ? new Date(event.endDate) : null,
        location: event.location || null,
        url: event.url || null,
        category: event.category || "General",
        organizer: event.organizer || null,
        source: "excel",
        userId: session.userId,
      },
    })
    imported++
  }

  return Response.json({ imported, skipped, total: parsed.length })
}
