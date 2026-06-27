import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function fmtDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function WorkoutsPage() {
  const workouts = await prisma.workout.findMany({
    orderBy: { date: 'desc' },
    include: {
      template: { select: { name: true } },
      workoutSets: { select: { exerciseId: true } },
    },
  })

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Workouts</h1>
        <Link
          href="/workouts/new"
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          Start
        </Link>
      </div>

      {workouts.length === 0 ? (
        <p className="text-center text-gray-500 text-sm py-10">
          No workouts yet — tap Start to log your first session.
        </p>
      ) : (
        <ul className="space-y-2">
          {workouts.map(w => {
            const setCount = w.workoutSets.length
            const exerciseCount = new Set(w.workoutSets.map(s => s.exerciseId)).size
            return (
              <li key={w.id}>
                <Link
                  href={`/workouts/${w.id}`}
                  className="flex items-center justify-between bg-gray-900 hover:bg-gray-800 rounded-xl p-4 transition-colors"
                >
                  <div>
                    <p className="font-semibold">{w.template.name}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{fmtDate(w.date)}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm text-gray-400">{setCount} sets</p>
                    {exerciseCount > 0 && (
                      <p className="text-xs text-gray-600 mt-0.5">{exerciseCount} exercises</p>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
