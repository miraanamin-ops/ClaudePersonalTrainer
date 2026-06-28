import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getWorkoutPrescriptions, getActiveMesocycle } from '@/lib/prescriptions'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const workoutIdParam = searchParams.get('workoutId')

  // If no workoutId given, return active mesocycle state + last workout's prescription
  if (!workoutIdParam) {
    const meso = await getActiveMesocycle()
    const lastWorkout = await prisma.workout.findFirst({
      orderBy: { date: 'desc' },
      select: { id: true, date: true, template: { select: { name: true } } },
    })
    return NextResponse.json({
      activeMesocycle: meso,
      lastWorkout,
      hint: 'Pass ?workoutId=N to see prescriptions for a specific workout',
    })
  }

  const workoutId = parseInt(workoutIdParam)
  if (isNaN(workoutId)) {
    return NextResponse.json({ error: 'Invalid workoutId' }, { status: 400 })
  }

  const prescriptions = await getWorkoutPrescriptions(workoutId)
  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: {
      template: { select: { name: true } },
      mesocycle: true,
    },
  })

  return NextResponse.json({
    workout: {
      id: workoutId,
      date: workout?.date,
      template: workout?.template.name,
      mesocycle: workout?.mesocycle,
    },
    prescriptions: Object.fromEntries(prescriptions.prescriptions),
    rirAdjustment: prescriptions.rirAdjustment,
    readinessCategory: prescriptions.readinessCategory,
  })
}
