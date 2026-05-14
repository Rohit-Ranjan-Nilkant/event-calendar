import { NextRequest } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_SIZE_MB = 2

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  if (!file || file.size === 0) {
    return Response.json({ error: "No file provided" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json(
      { error: "Only JPEG, PNG, WebP, or GIF images are allowed" },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return Response.json(
      { error: `File must be smaller than ${MAX_SIZE_MB} MB` },
      { status: 400 }
    )
  }

  const ext = file.type.split("/")[1].replace("jpeg", "jpg")
  const filename = `${session.userId}.${ext}`
  const avatarDir = path.join(process.cwd(), "public", "avatars")

  try {
    await mkdir(avatarDir, { recursive: true })
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(avatarDir, filename), buffer)
  } catch {
    return Response.json({ error: "Failed to save avatar" }, { status: 500 })
  }

  const imageUrl = `/avatars/${filename}`
  await prisma.user.update({
    where: { id: session.userId },
    data: { image: imageUrl },
  })

  return Response.json({ image: imageUrl })
}
