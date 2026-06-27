'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createBodyMetric(data: {
  date: string
  weightKg: number
  bodyFatPct: number | null
}) {
  await prisma.bodyMetrics.create({
    data: {
      date: new Date(`${data.date}T12:00:00Z`),
      weightKg: data.weightKg,
      bodyFatPct: data.bodyFatPct,
      notes: null,
    },
  })
  revalidatePath('/body')
}

export async function updateBodyMetric(
  id: number,
  data: { date: string; weightKg: number; bodyFatPct: number | null },
) {
  await prisma.bodyMetrics.update({
    where: { id },
    data: {
      date: new Date(`${data.date}T12:00:00Z`),
      weightKg: data.weightKg,
      bodyFatPct: data.bodyFatPct,
    },
  })
  revalidatePath('/body')
}

export async function deleteBodyMetric(id: number) {
  await prisma.bodyMetrics.delete({ where: { id } })
  revalidatePath('/body')
}
