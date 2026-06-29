/**
 * Deletes all meal plans for a given week so they regenerate on next page visit.
 * Usage:
 *   npx tsx prisma/clearWeekPlans.ts        (clears THIS week)
 *   npx tsx prisma/clearWeekPlans.ts next   (clears NEXT week)
 *   npx tsx prisma/clearWeekPlans.ts both   (clears both)
 */
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(root, '.env.local') })
dotenv.config({ path: path.join(root, '.env') })

import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

function getWeekRange(weekOffset: number) {
  const now = new Date()
  const dow = now.getDay()
  const mon = new Date(now)
  mon.setDate(now.getDate() - ((dow + 6) % 7) + weekOffset * 7)
  mon.setHours(0, 0, 0, 0)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  sun.setHours(23, 59, 59, 999)
  return { start: mon, end: sun }
}

async function clearWeek(prisma: PrismaClient, offset: number, label: string) {
  const { start, end } = getWeekRange(offset)
  const plans = await prisma.mealPlan.findMany({
    where: { date: { gte: start, lte: end } },
    select: { id: true },
  })
  if (plans.length === 0) {
    console.log(`  ${label}: no plans found`)
    return
  }
  const ids = plans.map(p => p.id)
  await prisma.mealPlanSnack.deleteMany({ where: { mealPlanId: { in: ids } } })
  await prisma.mealPlan.deleteMany({ where: { id: { in: ids } } })
  console.log(`  ${label}: deleted ${plans.length} plans`)
}

async function main() {
  const arg = process.argv[2] ?? 'next'

  const adapter = new PrismaLibSQL({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })
  const prisma = new PrismaClient({ adapter })

  try {
    if (arg === 'both') {
      await clearWeek(prisma, 0, 'this week')
      await clearWeek(prisma, 1, 'next week')
    } else if (arg === 'next') {
      await clearWeek(prisma, 1, 'next week')
    } else {
      await clearWeek(prisma, 0, 'this week')
    }
    console.log('Done. Reload the page to regenerate.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(e => { console.error(e); process.exit(1) })
