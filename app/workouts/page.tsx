import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function fmtDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
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
    <main className="min-h-screen pb-24 px-margin-mobile pt-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-lg">
        <h1 className="text-headline-lg-mobile text-on-surface">Workouts</h1>
        <Link
          href="/workouts/new"
          className="h-10 px-md bg-primary-container text-on-primary-container font-bold rounded-lg flex items-center gap-1 text-label-caps active:scale-95 transition-all shadow-[0_0_14px_rgba(57,255,20,0.2)]"
        >
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
          START
        </Link>
      </div>

      {workouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="material-symbols-outlined text-secondary text-5xl">fitness_center</span>
          <p className="text-secondary text-body-sm">No workouts yet — tap Start to log your first session.</p>
        </div>
      ) : (
        <ul className="space-y-sm">
          {workouts.map(w => {
            const setCount = w.workoutSets.length
            const exerciseCount = new Set(w.workoutSets.map(s => s.exerciseId)).size
            return (
              <li key={w.id}>
                <Link
                  href={`/workouts/${w.id}`}
                  className="flex items-center justify-between bg-surface-container border border-surface-container-highest rounded-xl p-md active:bg-surface-container-high transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary-container text-[20px]">fitness_center</span>
                    </div>
                    <div>
                      <p className="text-body-lg font-semibold text-on-surface">{w.template.name}</p>
                      <p className="text-body-sm text-secondary mt-0.5">{fmtDate(w.date)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-headline-md text-primary-container">{setCount}</p>
                    <p className="text-[10px] text-secondary">
                      {setCount === 1 ? 'set' : 'sets'} · {exerciseCount} ex
                    </p>
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
