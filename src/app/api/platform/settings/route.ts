import { getPlatformSettings } from "@/lib/platform"

export async function GET() {
  const settings = await getPlatformSettings()
  return Response.json(settings)
}
