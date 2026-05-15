import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPlatformSettings } from "@/lib/platform"

export async function GET() {
  const settings = await getPlatformSettings()
  return Response.json(settings)
}

export async function PUT(request: Request) {
  await requireAdmin()
  const body = await request.json()

  // platformName may intentionally be empty — don't fallback to a default
  const platformName = typeof body.platformName === "string" ? body.platformName.trim() : ""

  const settings = await prisma.platformSettings.upsert({
    where: { id: "singleton" },
    update: {
      platformName,
      logoUrl: body.logoUrl || null,
      primaryColor: body.primaryColor || "indigo",
      privacyPolicyUrl: body.privacyPolicyUrl || null,
      termsUrl: body.termsUrl || null,
      customPrivacyText: body.customPrivacyText || null,
      customTermsText: body.customTermsText || null,
    },
    create: {
      id: "singleton",
      platformName,
      logoUrl: body.logoUrl || null,
      primaryColor: body.primaryColor || "indigo",
      privacyPolicyUrl: body.privacyPolicyUrl || null,
      termsUrl: body.termsUrl || null,
      customPrivacyText: body.customPrivacyText || null,
      customTermsText: body.customTermsText || null,
    },
  })

  return Response.json(settings)
}
