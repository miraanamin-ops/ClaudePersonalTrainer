import { prisma } from './prisma'
import { prescribeExercise, getWeeklyTargetRIR, type MesocycleContext, type Prescription } from './progression'
import {
  computeDeficitScore,
  readinessCategory,
  rirAdjustment,
  type ReadinessCategory,
} from './readiness'

export type { Prescription }

export async function getActiveMesocycle() {
  return prisma.mesocycle.findFirst({ orderBy: { startDate: 'desc' } })
}

export function isMesocycleComplete(m: { currentWeek: number; lengthWeeks: number }) {
  return m.currentWeek > m.lengthWeeks + 1
}

export async function getReadinessForDate(date: Date) {
  const start = new Date(date); start.setHours(0, 0, 0, 0)
  const end   = new Date(date); end.setHours(23, 59, 59, 999)
  return prisma.readiness.findFirst({
    where: { date: { gte: start, lte: end } },
    orderBy: { date: 'desc' },
  })
}

export async function getWorkoutPrescriptions(workoutId: number): Promise<{
  prescriptions: Map<number, Prescription>
  rirAdjustment: number
  readinessCategory: ReadinessCategory | null
}> {
  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: {
      mesocycle: true,
      template: {
        include: {
          templateExercises: {
            include: { exercise: true },
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  })

  if (!workout?.mesocycle) {
    return { prescriptions: new Map(), rirAdjustment: 0, readinessCategory: null }
  }

  const meso = workout.mesocycle
  const ctx: MesocycleContext = {
    blockNumber: meso.blockNumber,
    lengthWeeks: meso.lengthWeeks,
    currentWeek: meso.currentWeek,
    workoutsPerWeek: meso.workoutsPerWeek,
  }

  // Fetch today's readiness for this workout's date
  const todayReadiness = await getReadinessForDate(workout.date)
  let adj = 0
  let cat: ReadinessCategory | null = null
  if (todayReadiness) {
    const deficit = computeDeficitScore(todayReadiness.sleepHours, todayReadiness.soreness, todayReadiness.energy)
    cat = readinessCategory(deficit)
    adj = rirAdjustment(cat)
  }

  const prescriptions = new Map<number, Prescription>()

  await Promise.all(
    workout.template.templateExercises.map(async (te) => {
      const exerciseId = te.exerciseId

      const latestSet = await prisma.workoutSet.findFirst({
        where: { exerciseId, workout: { id: { not: workoutId } } },
        orderBy: { workout: { date: 'desc' } },
        select: { workoutId: true },
      })

      let lastSets: { weightKg: number; reps: number; rir: number }[] = []
      if (latestSet) {
        const rows = await prisma.workoutSet.findMany({
          where: { workoutId: latestSet.workoutId, exerciseId },
          orderBy: { setNumber: 'asc' },
        })
        lastSets = rows.map(r => ({ weightKg: r.weightKg, reps: r.reps, rir: r.rir }))
      }

      prescriptions.set(
        exerciseId,
        prescribeExercise(
          {
            repRangeLow: te.exercise.repRangeLow,
            repRangeHigh: te.exercise.repRangeHigh,
            incrementKg: te.exercise.incrementKg,
            isPriority: te.exercise.isPriority,
          },
          ctx,
          te.targetSets,
          lastSets,
          adj,
        ),
      )
    }),
  )

  return { prescriptions, rirAdjustment: adj, readinessCategory: cat }
}

export async function checkEarlyDeloadTriggers(
  mesoId: number,
  blockNumber: number,
  lengthWeeks: number,
): Promise<{ readinessTrigger: boolean; performanceTrigger: boolean }> {
  // Readiness trigger: last 3 check-ins all Moderate or worse (deficit ≥ 3)
  const recentReadiness = await prisma.readiness.findMany({
    orderBy: { date: 'desc' },
    take: 3,
  })
  const readinessTrigger =
    recentReadiness.length >= 3 &&
    recentReadiness.every(r => computeDeficitScore(r.sleepHours, r.soreness, r.energy) >= 3)

  // Performance trigger: last 2 workouts in this mesocycle both had avg actual RIR
  // more than 1.5 below that week's target — i.e. "grinding" fired twice in a row
  const recentWorkouts = await prisma.workout.findMany({
    where: { mesocycleId: mesoId, weekInBlock: { not: null } },
    orderBy: { date: 'desc' },
    take: 2,
    include: { workoutSets: { select: { rir: true } } },
  })
  const performanceTrigger =
    recentWorkouts.length >= 2 &&
    recentWorkouts.every(w => {
      if (!w.weekInBlock || w.workoutSets.length === 0) return false
      const weekTarget = getWeeklyTargetRIR(blockNumber, w.weekInBlock, lengthWeeks)
      const avgRIR = w.workoutSets.reduce((s, set) => s + set.rir, 0) / w.workoutSets.length
      return avgRIR < weekTarget - 1.5
    })

  return { readinessTrigger, performanceTrigger }
}
