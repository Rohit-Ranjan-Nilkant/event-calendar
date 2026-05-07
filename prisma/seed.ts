import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@digitalsherpa.ai"
  const password = process.env.ADMIN_PASSWORD ?? "Admin@DS2026!"
  const hashed = await hash(password, 12)

  const admin = await prisma.user.upsert({
    where: { email },
    update: { password: hashed, role: "ADMIN", name: "Admin" },
    create: { email, password: hashed, role: "ADMIN", name: "Admin" },
  })

  console.log(`✓ Admin user ready: ${admin.email}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
