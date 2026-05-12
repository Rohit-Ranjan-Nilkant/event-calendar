import { NextRequest } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const channel: string = body.channel ?? "email"
  const target: string = body.target ?? ""

  if (!target) {
    return Response.json({ error: "Target is required" }, { status: 400 })
  }

  // Fetch user's current preference for the test message
  const pref = await prisma.notificationPreference.findUnique({
    where: { userId: session.userId },
  })

  const testPayload = {
    text: `🎉 Test notification from DS EventHub! Your ${channel} notifications are working correctly.`,
    username: "DS EventHub",
    icon_emoji: ":calendar:",
  }

  if (channel === "slack" || channel === "discord") {
    try {
      const resp = await fetch(target, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          channel === "discord"
            ? { content: testPayload.text, username: testPayload.username }
            : testPayload
        ),
      })
      if (!resp.ok) {
        const errText = await resp.text().catch(() => resp.statusText)
        return Response.json(
          { error: `Webhook returned ${resp.status}: ${errText}` },
          { status: 400 }
        )
      }
      return Response.json({ ok: true, channel, target })
    } catch (err) {
      return Response.json(
        { error: `Failed to deliver: ${(err as Error).message}` },
        { status: 500 }
      )
    }
  }

  if (channel === "webhook") {
    try {
      const resp = await fetch(target, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "test",
          message: testPayload.text,
          userId: session.userId,
          timestamp: new Date().toISOString(),
        }),
      })
      if (!resp.ok) {
        const errText = await resp.text().catch(() => resp.statusText)
        return Response.json(
          { error: `Webhook returned ${resp.status}: ${errText}` },
          { status: 400 }
        )
      }
      return Response.json({ ok: true, channel, target })
    } catch (err) {
      return Response.json(
        { error: `Failed to deliver: ${(err as Error).message}` },
        { status: 500 }
      )
    }
  }

  // email — just acknowledge (actual email sending requires an email provider)
  if (channel === "email") {
    // Validate it looks like an email address
    if (!target.includes("@")) {
      return Response.json({ error: "Invalid email address" }, { status: 400 })
    }
    // In a real deployment wire up Resend/SendGrid/SES here
    return Response.json({
      ok: true,
      channel,
      target,
      note: "Email test acknowledged. Configure an email provider to send real messages.",
    })
  }

  void pref // suppress unused warning
  return Response.json({ error: "Unknown channel" }, { status: 400 })
}
