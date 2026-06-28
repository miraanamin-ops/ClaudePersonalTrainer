'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function logReadiness(
  sleepHours: number,
  soreness: number,
  energy: number,
  notes: string,
) {
  const now = new Date()
  const start = new Date(now); start.setHours(0, 0, 0, 0)
  const end   = new Date(now); end.setHours(23, 59, 59, 999)

  const existing = await prisma.readiness.findFirst({
    where: { date: { gte: start, lte: end } },
  })

  if (existing) {
    await prisma.readiness.update({
      where: { id: existing.id },
      data: { sleepHours, soreness, energy, notes: notes.trim() || null },
    })
  } else {
    await prisma.readiness.create({
      data: { date: now, sleepHours, soreness, energy, notes: notes.trim() || null },
    })
  }

  revalidatePath('/recovery')
}
