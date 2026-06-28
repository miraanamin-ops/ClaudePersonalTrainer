import { prisma } from '@/lib/prisma'
import { getActiveMesocycle } from '@/lib/prescriptions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function todayLabel() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).toUpperCase()
}

function weekRangeLabel() {
  const now = new Date()
  const dow = now.getDay()
  const mon = new Date(now)
  mon.setDate(now.getDate() - ((dow + 6) % 7))
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${fmt(mon)} – ${fmt(sun)}`
}

function greetingText() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function Home() {
  const [templates, meso, lastWorkout, todayReadiness] = await Promise.all([
    prisma.workoutTemplate.findMany({ orderBy: { id: 'asc' } }),
    getActiveMesocycle(),
    prisma.workout.findFirst({
      orderBy: { date: 'desc' },
      include: {
        template: { select: { name: true } },
        workoutSets: { select: { exerciseId: true } },
      },
    }),
    prisma.readiness.findFirst({
      where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
  ])

  const exerciseCount = new Set(lastWorkout?.workoutSets.map(s => s.exerciseId) ?? []).size
  const readinessScore = todayReadiness
    ? Math.round(((todayReadiness.sleepHours / 10) + ((6 - todayReadiness.soreness) / 5) + (todayReadiness.energy / 5)) / 3 * 10)
    : null

  return (
    <main className="min-h-screen pb-24 px-margin-mobile pt-6 max-w-md mx-auto">
      {/* Header */}
      <section className="mb-lg">
        <h2 className="text-3xl font-bold text-on-surface">{greetingText()}, Miraan</h2>
        <p className="text-secondary text-label-caps mt-1">{todayLabel()}</p>
      </section>

      {/* Active block card */}
      {meso && (
        <section className="bg-surface-container border border-surface-container-highest rounded-xl p-md mb-lg">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-label-caps text-secondary block mb-1 uppercase">Training Block</span>
              <h3 className="text-headline-md text-on-surface">
                Block {meso.blockNumber} · Week {meso.currentWeek} of {meso.lengthWeeks}
              </h3>
              <p className="text-body-sm text-secondary mt-1">
                {meso.workoutsPerWeek} sessions/week
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-bold bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full uppercase">Active</span>
              <span className="text-label-caps text-secondary">{templates.length} templates</span>
            </div>
          </div>
          {/* Week progress dots */}
          <div className="flex gap-2 mt-md">
            {Array.from({ length: meso.lengthWeeks }, (_, i) => i + 1).map(w => (
              <div
                key={w}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  w < meso.currentWeek
                    ? 'bg-primary-container'
                    : w === meso.currentWeek
                    ? 'bg-primary-container'
                    : 'bg-surface-container-highest'
                }`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Start workout CTA */}
      <Link
        href="/workouts/new"
        className="w-full h-14 bg-primary-container text-on-primary-container font-bold text-lg rounded-xl flex items-center justify-center gap-2 mb-lg active:scale-95 transition-transform shadow-[0_0_20px_rgba(57,255,20,0.2)]"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
        Start Today's Workout
      </Link>

      {/* Last workout summary */}
      {lastWorkout && (
        <Link
          href={`/workouts/${(lastWorkout as { id: number }).id}`}
          className="block bg-surface-container border border-surface-container-highest rounded-xl p-md mb-lg active:bg-surface-container-high transition-colors"
        >
          <span className="text-label-caps text-secondary uppercase block mb-1">Last Workout</span>
          <h3 className="text-headline-md text-on-surface">{lastWorkout.template.name}</h3>
          <p className="text-body-sm text-secondary mt-1">
            {lastWorkout.workoutSets.length} sets · {exerciseCount} exercises
          </p>
        </Link>
      )}

      {/* Recovery status */}
      <section className="bg-surface-container border border-surface-container-highest rounded-xl p-md mb-lg">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-label-caps text-secondary uppercase block mb-1">Recovery Status</span>
            {todayReadiness ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-display-stat text-primary-container">{readinessScore}</span>
                  <span className="text-label-caps text-secondary">/10</span>
                </div>
                <p className="text-body-sm text-secondary">
                  Sleep {todayReadiness.sleepHours}h · Soreness {todayReadiness.soreness}/5
                </p>
              </>
            ) : (
              <p className="text-body-sm text-secondary mt-1">No check-in yet today</p>
            )}
          </div>
          <Link
            href="/recovery"
            className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-secondary hover:text-primary-container transition-colors"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </Link>
        </div>
      </section>

      {/* This week's meals */}
      <Link
        href="/nutrition/week"
        className="block bg-surface-container border border-surface-container-highest rounded-xl p-md mb-lg active:bg-surface-container-high transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary-container text-[20px]">calendar_month</span>
            </div>
            <div>
              <span className="text-label-caps text-secondary block mb-0.5">FOOD</span>
              <p className="text-headline-md text-on-surface">This week's meals</p>
              <p className="text-body-sm text-secondary mt-0.5">{weekRangeLabel()}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-secondary">chevron_right</span>
        </div>
      </Link>

      {/* Quick nav grid */}
      <div className="grid grid-cols-2 gap-md">
        <Link href="/nutrition" className="bg-surface-container border border-surface-container-highest rounded-xl p-md flex items-center gap-3 active:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-primary-container">restaurant</span>
          <span className="text-body-sm font-semibold text-on-surface">Food Plan</span>
        </Link>
        <Link href="/body" className="bg-surface-container border border-surface-container-highest rounded-xl p-md flex items-center gap-3 active:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-primary-container">monitor_weight</span>
          <span className="text-body-sm font-semibold text-on-surface">Body Stats</span>
        </Link>
        <Link href="/block" className="bg-surface-container border border-surface-container-highest rounded-xl p-md flex items-center gap-3 active:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-primary-container">calendar_month</span>
          <span className="text-body-sm font-semibold text-on-surface">Training Block</span>
        </Link>
        <Link href="/workouts" className="bg-surface-container border border-surface-container-highest rounded-xl p-md flex items-center gap-3 active:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-primary-container">history</span>
          <span className="text-body-sm font-semibold text-on-surface">History</span>
        </Link>
      </div>
    </main>
  )
}
