'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createMesocycle(lengthWeeks: number, workoutsPerWeek: number) {
  const blockNumber = (await prisma.mesocycle.count()) + 1
  await prisma.mesocycle.create({
    data: {
      startDate: new Date(),
      lengthWeeks,
      currentWeek: 1,
      blockNumber,
      workoutsPerWeek,
    },
  })
  redirect('/block')
}

export async function advanceWeek(mesocycleId: number) {
  const meso = await prisma.mesocycle.findUnique({ where: { id: mesocycleId } })
  if (!meso) return
  await prisma.mesocycle.update({
    where: { id: mesocycleId },
    data: { currentWeek: meso.currentWeek + 1 },
  })
  revalidatePath('/block')
}

export async function triggerEarlyDeload(mesocycleId: number) {
  const meso = await prisma.mesocycle.findUnique({ where: { id: mesocycleId } })
  if (!meso) return
  await prisma.mesocycle.update({
    where: { id: mesocycleId },
    data: { currentWeek: meso.lengthWeeks + 1 },
  })
  revalidatePath('/block')
}
