import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import LoginForm from "@/components/LoginForm"

export default async function LoginPage() {
  const session = await getSession()
  if (session) redirect(session.role === "ADMIN" ? "/admin/events" : "/dashboard")
  return <LoginForm />
}
