import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import WorkoutExercise from '@/components/WorkoutExercise'

export const dynamic = 'force-dynamic'

function fmtDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

type Props = { params: Promise<{ id: string }> }

export default async function WorkoutPage({ params }: Props) {
  const { id } = await params
  const workoutId = parseInt(id)
  if (isNaN(workoutId)) notFound()

  const workout = await prisma.workout.findUnique({
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
    },
  })

  if (!workout) notFound()

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold">{workout.template.name}</h1>
        <Link
          href="/workouts"
          className="text-sm text-green-400 hover:text-green-300 font-medium transition-colors"
        >
          Done
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-6">{fmtDate(workout.date)}</p>

      {/* Exercises */}
      <div className="space-y-4">
        {workout.template.templateExercises.map(te => {
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
              targetSets={te.targetSets}
              loggedSets={sets}
            />
          )
        })}
      </div>
    </main>
  )
}
