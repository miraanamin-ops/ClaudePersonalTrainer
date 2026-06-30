import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import DeleteWorkoutButton from '@/components/DeleteWorkoutButton'
import DeleteActivityButton from '@/components/DeleteActivityButton'
import ActivityLogForm from '@/components/ActivityLogForm'
import ActivityCharts, { type ActivityChartPoint } from '@/components/ActivityCharts'

export const dynamic = 'force-dynamic'

function fmtDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function fmtChartLabel(date: Date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function fmtPace(durMin: number, distKm: number): string {
  if (distKm <= 0) return '--'
  const raw = durMin / distKm
  const whole = Math.floor(raw)
  const secs = Math.round((raw - whole) * 60)
  return `${whole}:${String(secs).padStart(2, '0')}/km`
}

const ACT_ICON: Record<string, string> = {
  run:   'directions_run',
  walk:  'directions_walk',
  cycle: 'directions_bike',
  swim:  'pool',
  other: 'exercise',
}

const ACT_LABEL: Record<string, string> = {
  run:   'Run',
  walk:  'Walk',
  cycle: 'Cycle',
  swim:  'Swim',
  other: 'Activity',
}

type WorkoutRow = Awaited<ReturnType<typeof getWorkouts>>[number]
type ActivityRow = Awaited<ReturnType<typeof getActivities>>[number]
type TripRow = Awaited<ReturnType<typeof getTrips>>[number]

function getWorkouts() {
  return prisma.workout.findMany({
    orderBy: { date: 'desc' },
    include: {
      template: { select: { name: true } },
      workoutSets: { select: { exerciseId: true } },
    },
  })
}

function getActivities() {
  return prisma.activity.findMany({ orderBy: { date: 'desc' } })
}

function getTrips() {
  return prisma.gymTrip.findMany({ orderBy: { date: 'desc' } })
}

type FeedItem =
  | { kind: 'workout'; date: Date; w: WorkoutRow }
  | { kind: 'activity'; date: Date; a: ActivityRow }

function buildChartData(trips: TripRow[], activities: ActivityRow[]): ActivityChartPoint[] {
  const tripPoints = trips.map(t => {
    const runDistKm =
      (t.travelToMode === 'run' && t.travelToDistKm ? t.travelToDistKm : 0) +
      (t.travelFromMode === 'run' && t.travelFromDistKm ? t.travelFromDistKm : 0)
    const runDurMin =
      (t.travelToMode === 'run' && t.travelToDurMin ? t.travelToDurMin : 0) +
      (t.travelFromMode === 'run' && t.travelFromDurMin ? t.travelFromDurMin : 0)
    const hasRun = runDistKm > 0
    return {
      date: t.date,
      distKm: hasRun ? runDistKm : null,
      durMin: hasRun && runDurMin > 0 ? runDurMin : null,
      pace: hasRun && runDurMin > 0 ? runDurMin / runDistKm : null,
      totalCal:
        (t.travelToCalories ?? 0) + (t.travelFromCalories ?? 0) + (t.workoutCalories ?? 0),
    }
  })

  const actPoints = activities.map(a => {
    const hasRun = a.distKm != null && a.distKm > 0
    return {
      date: a.date,
      distKm: hasRun ? a.distKm! : null,
      durMin: a.durMin && a.durMin > 0 ? a.durMin : null,
      pace: hasRun && a.durMin && a.durMin > 0 ? a.durMin / a.distKm! : null,
      totalCal: a.calories ?? 0,
    }
  })

  return [...tripPoints, ...actPoints]
    .sort((x, y) => x.date.getTime() - y.date.getTime())
    .map(p => ({
      label: fmtChartLabel(p.date),
      distKm: p.distKm,
      durMin: p.durMin,
      pace: p.pace,
      totalCal: p.totalCal,
    }))
}

export default async function WorkoutsPage() {
  const [workouts, activities, trips] = await Promise.all([
    getWorkouts(),
    getActivities(),
    getTrips(),
  ])

  const chartData = buildChartData(trips, activities)

  const feed: FeedItem[] = [
    ...workouts.map((w): FeedItem => ({ kind: 'workout', date: w.date, w })),
    ...activities.map((a): FeedItem => ({ kind: 'activity', date: a.date, a })),
  ].sort((x, y) => y.date.getTime() - x.date.getTime())

  return (
    <main className="min-h-screen pb-24 px-margin-mobile pt-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-lg gap-sm">
        <h1 className="text-headline-lg-mobile text-on-surface">Workouts</h1>
        <div className="flex items-center gap-sm shrink-0">
          <ActivityLogForm />
          <Link
            href="/workouts/new"
            className="h-10 px-md bg-primary-container text-on-primary-container font-bold rounded-lg flex items-center gap-1 text-label-caps active:scale-95 transition-all shadow-[0_0_14px_rgba(57,255,20,0.2)]"
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            START
          </Link>
        </div>
      </div>

      {chartData.length >= 2 && <ActivityCharts data={chartData} />}

      {feed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="material-symbols-outlined text-secondary text-5xl">fitness_center</span>
          <p className="text-secondary text-body-sm text-center">No workouts yet — tap Start to log a session, or Activity to log a run.</p>
        </div>
      ) : (
        <ul className="space-y-sm">
          {feed.map(item => {
            if (item.kind === 'workout') {
              const w = item.w
              const setCount = w.workoutSets.length
              const exerciseCount = new Set(w.workoutSets.map(s => s.exerciseId)).size
              return (
                <li key={`w-${w.id}`} className="flex items-center gap-sm">
                  <Link
                    href={`/workouts/${w.id}`}
                    className="flex-1 flex items-center justify-between bg-surface-container border border-surface-container-highest rounded-xl p-md active:bg-surface-container-high transition-colors min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary-container text-[20px]">fitness_center</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-body-lg font-semibold text-on-surface truncate">{w.template.name}</p>
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
                  <DeleteWorkoutButton workoutId={w.id} variant="delete" />
                </li>
              )
            }

            const a = item.a
            const hasDist = a.distKm != null && a.distKm > 0
            const hasDur = a.durMin != null && a.durMin > 0
            return (
              <li key={`a-${a.id}`} className="flex items-center gap-sm">
                <div className="flex-1 flex items-center justify-between bg-surface-container border border-surface-container-highest rounded-xl p-md min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary-container text-[20px]">{ACT_ICON[a.type] ?? 'exercise'}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-body-lg font-semibold text-on-surface truncate">
                        {ACT_LABEL[a.type] ?? 'Activity'}
                        {a.note ? <span className="text-secondary font-normal"> · {a.note}</span> : null}
                      </p>
                      <p className="text-body-sm text-secondary mt-0.5">
                        {fmtDate(a.date)}
                        {hasDist && hasDur ? ` · ${fmtPace(a.durMin!, a.distKm!)}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    {hasDist ? (
                      <>
                        <p className="text-headline-md text-primary-container">{a.distKm!.toFixed(2)}</p>
                        <p className="text-[10px] text-secondary">
                          km{hasDur ? ` · ${Math.round(a.durMin!)} min` : ''}
                        </p>
                      </>
                    ) : hasDur ? (
                      <>
                        <p className="text-headline-md text-primary-container">{Math.round(a.durMin!)}</p>
                        <p className="text-[10px] text-secondary">min</p>
                      </>
                    ) : a.calories ? (
                      <>
                        <p className="text-headline-md text-primary-container">{a.calories}</p>
                        <p className="text-[10px] text-secondary">kcal</p>
                      </>
                    ) : null}
                  </div>
                </div>
                <DeleteActivityButton activityId={a.id} />
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
