'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createWorkout(templateId: number): Promise<number> {
  const activeMeso = await prisma.mesocycle.findFirst({
    orderBy: { startDate: 'desc' },
  })

  const workout = await prisma.workout.create({
    data: {
      date: new Date(),
      templateId,
      mesocycleId: activeMeso?.id ?? null,
      weekInBlock: activeMeso?.currentWeek ?? null,
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

export async function deleteWorkout(workoutId: number) {
  await prisma.gymTrip.deleteMany({ where: { workoutId } })
  await prisma.workoutSet.deleteMany({ where: { workoutId } })
  await prisma.workout.delete({ where: { id: workoutId } })
  redirect('/workouts')
}

export type WorkoutTripInput = {
  travelToMode: string
  travelToCalories: number | null
  travelToDistKm: number | null
  travelToDurMin: number | null
  travelFromMode: string
  travelFromCalories: number | null
  travelFromDistKm: number | null
  travelFromDurMin: number | null
  workoutCalories: number | null
}

// Logs (or updates) the gym commute + cardio for a specific workout. The trip is
// linked to the workout and dated to the workout's date, so it shows up in the
// Activity history/charts but is captured in-session rather than as a loose entry.
export async function saveWorkoutTrip(workoutId: number, data: WorkoutTripInput) {
  const workout = await prisma.workout.findUnique({ where: { id: workoutId }, select: { date: true } })
  if (!workout) return

  const existing = await prisma.gymTrip.findFirst({ where: { workoutId } })
  const payload = { date: workout.date, workoutId, ...data }

  if (existing) {
    await prisma.gymTrip.update({ where: { id: existing.id }, data: payload })
  } else {
    await prisma.gymTrip.create({ data: payload })
  }
  revalidatePath(`/workouts/${workoutId}`)
  revalidatePath('/workouts')
}

export async function deleteWorkoutTrip(workoutId: number) {
  await prisma.gymTrip.deleteMany({ where: { workoutId } })
  revalidatePath(`/workouts/${workoutId}`)
  revalidatePath('/workouts')
}

export type ActivityInput = {
  dateISO: string
  type: string
  distKm: number | null
  durMin: number | null
  calories: number | null
  note: string | null
}

// Logs a standalone cardio activity (a run/walk/cycle/swim done outside of a
// gym session). Appears in the unified Workouts list and feeds the cardio charts.
export async function createActivity(data: ActivityInput) {
  const date = new Date(data.dateISO)
  await prisma.activity.create({
    data: {
      date: isNaN(date.getTime()) ? new Date() : date,
      type: data.type,
      distKm: data.distKm,
      durMin: data.durMin,
      calories: data.calories,
      note: data.note,
    },
  })
  revalidatePath('/workouts')
}

export async function deleteActivity(id: number) {
  await prisma.activity.delete({ where: { id } })
  revalidatePath('/workouts')
}
