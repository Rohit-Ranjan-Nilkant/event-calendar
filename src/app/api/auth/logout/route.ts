import { destroySession } from "@/lib/session"
import { NextResponse } from "next/server"

export async function POST() {
  await destroySession()
  return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL || "http://localhost:3000"))
}
