import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { getPlatformSettings } from "@/lib/platform"
import LoginForm from "@/components/LoginForm"

export default async function LoginPage() {
  const session = await getSession()
  if (session) redirect(session.role === "ADMIN" ? "/admin/events" : "/dashboard")
  const platform = await getPlatformSettings()
  return (
    <LoginForm
      platformName={platform.platformName}
      logoUrl={platform.logoUrl ?? undefined}
    />
  )
}
