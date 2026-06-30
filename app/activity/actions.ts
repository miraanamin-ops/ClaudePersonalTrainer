'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function logTrip(data: {
  dateStr: string
  travelToMode: string
  travelToCalories: number | null
  travelToDistKm: number | null
  travelToDurMin: number | null
  travelFromMode: string
  travelFromCalories: number | null
  travelFromDistKm: number | null
  travelFromDurMin: number | null
  workoutCalories: number | null
}) {
  await prisma.gymTrip.create({
    data: {
      date: new Date(data.dateStr),
      travelToMode: data.travelToMode,
      travelToCalories: data.travelToCalories,
      travelToDistKm: data.travelToDistKm,
      travelToDurMin: data.travelToDurMin,
      travelFromMode: data.travelFromMode,
      travelFromCalories: data.travelFromCalories,
      travelFromDistKm: data.travelFromDistKm,
      travelFromDurMin: data.travelFromDurMin,
      workoutCalories: data.workoutCalories,
    },
  })
  revalidatePath('/activity')
}

export async function deleteTrip(id: number) {
  await prisma.gymTrip.delete({ where: { id } })
  revalidatePath('/activity')
}
