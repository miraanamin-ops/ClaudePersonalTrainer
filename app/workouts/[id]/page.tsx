import { prisma } from '@/lib/prisma'
import { getWorkoutPrescriptions } from '@/lib/prescriptions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import WorkoutExercise from '@/components/WorkoutExercise'
import WorkoutCommute from '@/components/WorkoutCommute'
import DeleteWorkoutButton from '@/components/DeleteWorkoutButton'

export const dynamic = 'force-dynamic'

function fmtDate(date: Date) {
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

type Props = { params: Promise<{ id: string }> }

export default async function WorkoutPage({ params }: Props) {
  const { id } = await params
  const workoutId = parseInt(id)
  if (isNaN(workoutId)) notFound()

  const [workout, prescriptions] = await Promise.all([
    prisma.workout.findUnique({
      where: { id: workoutId },
      include: {
        template: {
          include: {
            templateExercises: {
              orderBy: { order: 'asc' },
              include: { exercise: true },
            },
          },
        },
        workoutSets: { orderBy: { setNumber: 'asc' } },
        gymTrips: true,
      },
    }),
    getWorkoutPrescriptions(workoutId),
  ])

  if (!workout) notFound()

  const trip = workout.gymTrips[0] ?? null

  const totalExercises = workout.template.templateExercises.length
  const completedExercises = workout.template.templateExercises.filter(te => {
    const targetSets = prescriptions.prescriptions.get(te.exerciseId)?.targetSets ?? te.targetSets
    return workout.workoutSets.filter(s => s.exerciseId === te.exerciseId).length >= targetSets
  }).length

  return (
    <main className="min-h-screen pb-24 max-w-md mx-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-surface-container-highest">
        <div className="flex items-center justify-between px-margin-mobile h-16">
          <div className="flex-1 min-w-0">
            <h1 className="text-headline-md text-on-surface truncate">{workout.template.name}</h1>
            <p className="text-[10px] text-secondary">{fmtDate(workout.date)}</p>
          </div>
          <div className="flex items-center gap-md ml-4 shrink-0">
            <DeleteWorkoutButton workoutId={workout.id} variant="cancel" />
            <Link
              href="/workouts"
              className="h-10 px-md bg-primary-container text-on-primary-container font-bold rounded-lg flex items-center text-label-caps active:scale-95 transition-all"
            >
              DONE
            </Link>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-surface-container-high mx-margin-mobile mb-0">
          <div
            className="h-full bg-primary-container transition-all duration-500"
            style={{ width: totalExercises > 0 ? `${(completedExercises / totalExercises) * 100}%` : '0%' }}
          />
        </div>
        <div className="flex justify-between px-margin-mobile py-xs">
          <span className="text-label-caps text-secondary">{completedExercises}/{totalExercises} exercises</span>
          {completedExercises === totalExercises && totalExercises > 0 && (
            <span className="text-label-caps text-primary-container">Complete!</span>
          )}
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-md px-margin-mobile pt-md">
        {workout.template.templateExercises.map(te => {
          const prescription = prescriptions.prescriptions.get(te.exerciseId) ?? null
          const sets = workout.workoutSets
            .filter(s => s.exerciseId === te.exerciseId)
            .map(s => ({
              id: s.id,
              setNumber: s.setNumber,
              weightKg: s.weightKg,
              reps: s.reps,
              rir: s.rir,
            }))

          return (
            <WorkoutExercise
              key={te.id}
              workoutId={workout.id}
              exercise={{
                id: te.exercise.id,
                name: te.exercise.name,
                muscleGroup: te.exercise.muscleGroup,
                repRangeLow: te.exercise.repRangeLow,
                repRangeHigh: te.exercise.repRangeHigh,
              }}
              targetSets={prescription?.targetSets ?? te.targetSets}
              prescription={prescription}
              loggedSets={sets}
            />
          )
        })}

        {/* Commute & cardio — captured in-session, before tapping DONE */}
        <WorkoutCommute
          workoutId={workout.id}
          trip={trip && {
            travelToMode:       trip.travelToMode,
            travelToCalories:   trip.travelToCalories,
            travelToDistKm:     trip.travelToDistKm,
            travelToDurMin:     trip.travelToDurMin,
            travelFromMode:     trip.travelFromMode,
            travelFromCalories: trip.travelFromCalories,
            travelFromDistKm:   trip.travelFromDistKm,
            travelFromDurMin:   trip.travelFromDurMin,
            workoutCalories:    trip.workoutCalories,
          }}
        />
      </div>
    </main>
  )
}
