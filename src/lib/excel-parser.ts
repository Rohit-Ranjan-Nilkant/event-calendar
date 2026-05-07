import * as XLSX from "xlsx"

export interface ParsedEvent {
  title: string
  description?: string
  startDate: string
  endDate?: string
  location?: string
  url?: string
  category?: string
  organizer?: string
}

export function parseExcelBuffer(buffer: Buffer): ParsedEvent[] {
  const workbook = XLSX.read(buffer, { type: "buffer" })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

  return data
    .map((row) => ({
      title: String(row["Event Title"] || row["Title"] || row["title"] || ""),
      description: String(row["Description"] || row["description"] || ""),
      startDate: parseDate(row["Start Date"] || row["startDate"] || row["Date"] || row["date"]),
      endDate: parseDate(row["End Date"] || row["endDate"]),
      location: String(row["Location"] || row["location"] || ""),
      url: String(row["URL"] || row["url"] || row["Link"] || row["link"] || ""),
      category: String(row["Category"] || row["category"] || "General"),
      organizer: String(row["Organizer"] || row["organizer"] || ""),
    }))
    .filter((e) => e.title && e.startDate)
}

function parseDate(value: unknown): string {
  if (!value) return ""
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value)
    return new Date(date.y, date.m - 1, date.d).toISOString()
  }
  const parsed = new Date(String(value))
  return isNaN(parsed.getTime()) ? "" : parsed.toISOString()
}

export function generateTemplate(): Buffer {
  const workbook = XLSX.utils.book_new()
  const data = [
    {
      "Event Title": "Annual Conference 2026",
      Description: "Annual industry conference with keynote speakers",
      "Start Date": "2026-06-15",
      "End Date": "2026-06-17",
      Location: "New Delhi, India",
      URL: "https://example.com/conference",
      Category: "Conference",
      Organizer: "DigitalSherpa",
    },
    {
      "Event Title": "Workshop: Digital Marketing",
      Description: "Hands-on workshop on digital marketing strategies",
      "Start Date": "2026-07-10",
      "End Date": "2026-07-10",
      Location: "Mumbai, India",
      URL: "https://example.com/workshop",
      Category: "Workshop",
      Organizer: "DigitalSherpa",
    },
    {
      "Event Title": "AI & Automation Webinar",
      Description: "Live webinar on AI-driven business automation",
      "Start Date": "2026-08-05",
      "End Date": "",
      Location: "Online",
      URL: "https://example.com/webinar",
      Category: "Webinar",
      Organizer: "DigitalSherpa",
    },
  ]
  const worksheet = XLSX.utils.json_to_sheet(data)

  worksheet["!cols"] = [
    { wch: 30 },
    { wch: 50 },
    { wch: 15 },
    { wch: 15 },
    { wch: 25 },
    { wch: 35 },
    { wch: 15 },
    { wch: 20 },
  ]

  XLSX.utils.book_append_sheet(workbook, worksheet, "Events")
  return Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }))
}
