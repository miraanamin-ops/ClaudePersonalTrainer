'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createWorkout(templateId: number): Promise<number> {
  const workout = await prisma.workout.create({
    data: {
      date: new Date(),
      templateId,
      mesocycleId: null,
      weekInBlock: null,
      notes: null,
    },
  })
  return workout.id
}

export async function addSet(
  workoutId: number,
  exerciseId: number,
  setNumber: number,
  weightKg: number,
  reps: number,
  rir: number,
) {
  await prisma.workoutSet.create({
    data: { workoutId, exerciseId, setNumber, weightKg, reps, rir },
  })
  revalidatePath(`/workouts/${workoutId}`)
}

export async function deleteSet(setId: number, workoutId: number) {
  await prisma.workoutSet.delete({ where: { id: setId } })
  revalidatePath(`/workouts/${workoutId}`)
}
