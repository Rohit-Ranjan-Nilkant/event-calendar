import { generateTemplate } from "@/lib/excel-parser"

export async function GET() {
  const buffer = generateTemplate()

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="event-template.xlsx"',
    },
  })
}
