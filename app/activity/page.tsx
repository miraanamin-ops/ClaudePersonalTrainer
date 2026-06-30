import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ActivityCharts, { type ActivityChartPoint } from '@/components/ActivityCharts'
import DeleteTripButton from '@/components/DeleteTripButton'

export const dynamic = 'force-dynamic'

function fmtDate(date: Date) {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function modeIcon(mode: string) {
  switch (mode) {
    case 'run':          return 'directions_run'
    case 'walk':         return 'directions_walk'
    case 'drive':        return 'drive_eta'
    case 'dropped_off':  return 'person_pin'
    default:             return 'directions_run'
  }
}

function modeLabel(mode: string) {
  switch (mode) {
    case 'run':          return 'Run'
    case 'walk':         return 'Walk'
    case 'drive':        return 'Drive'
    case 'dropped_off':  return 'Drop-off'
    default:             return mode
  }
}

function fmtPace(durMin: number, distKm: number): string {
  if (distKm <= 0) return '--'
  const paceRaw = durMin / distKm
  const whole = Math.floor(paceRaw)
  const secs = Math.round((paceRaw - whole) * 60)
  return `${whole}:${String(secs).padStart(2, '0')}/km`
}

export default async function ActivityPage() {
  const trips = await prisma.gymTrip.findMany({ orderBy: { date: 'desc' } })

  const ascending = [...trips].reverse()
  const chartData: ActivityChartPoint[] = ascending.map(t => {
    const runDistKm =
      (t.travelToMode === 'run' && t.travelToDistKm ? t.travelToDistKm : 0) +
      (t.travelFromMode === 'run' && t.travelFromDistKm ? t.travelFromDistKm : 0)
    const runDurMin =
      (t.travelToMode === 'run' && t.travelToDurMin ? t.travelToDurMin : 0) +
      (t.travelFromMode === 'run' && t.travelFromDurMin ? t.travelFromDurMin : 0)
    const hasRun = runDistKm > 0

    return {
      label: t.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      distKm: hasRun ? runDistKm : null,
      durMin: hasRun && runDurMin > 0 ? runDurMin : null,
      pace:   hasRun && runDurMin > 0 ? runDurMin / runDistKm : null,
      totalCal:
        (t.travelToCalories ?? 0) +
        (t.travelFromCalories ?? 0) +
        (t.workoutCalories ?? 0),
    }
  })

  return (
    <main className="min-h-screen pb-24 px-margin-mobile pt-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-lg">
        <h1 className="text-headline-lg-mobile text-on-surface">Activity</h1>
        <Link
          href="/activity/new"
          className="h-10 px-md bg-primary-container text-on-primary-container font-bold rounded-lg flex items-center gap-1 text-label-caps active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          LOG TRIP
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex mb-lg border-b border-surface-container-highest">
        <Link
          href="/workouts"
          className="flex-1 text-center pb-sm text-label-caps text-secondary border-b-2 border-transparent -mb-px"
        >
          WORKOUTS
        </Link>
        <span className="flex-1 text-center pb-sm text-label-caps font-bold text-primary-container border-b-2 border-primary-container -mb-px">
          ACTIVITY
        </span>
      </div>

      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="material-symbols-outlined text-secondary text-5xl">directions_run</span>
          <p className="text-secondary text-body-sm text-center">
            No trips logged yet — tap Log Trip to record your first gym commute.
          </p>
        </div>
      ) : (
        <>
          {chartData.length >= 2 && <ActivityCharts data={chartData} />}

          <ul className="space-y-sm">
            {trips.map(t => {
              const toIsRun   = t.travelToMode   === 'run'
              const fromIsRun = t.travelFromMode === 'run'
              const runDistKm =
                (toIsRun   && t.travelToDistKm   ? t.travelToDistKm   : 0) +
                (fromIsRun && t.travelFromDistKm ? t.travelFromDistKm : 0)
              const runDurMin =
                (toIsRun   && t.travelToDurMin   ? t.travelToDurMin   : 0) +
                (fromIsRun && t.travelFromDurMin ? t.travelFromDurMin : 0)
              const totalCal =
                (t.travelToCalories   ?? 0) +
                (t.travelFromCalories ?? 0) +
                (t.workoutCalories    ?? 0)

              return (
                <li key={t.id} className="bg-surface-container border border-surface-container-highest rounded-xl p-md">
                  <div className="flex items-start justify-between mb-sm">
                    <p className="text-body-lg font-semibold text-on-surface">{fmtDate(t.date)}</p>
                    <div className="flex items-center gap-sm">
                      {totalCal > 0 && (
                        <span className="text-label-caps text-primary-container font-bold">{totalCal} kcal</span>
                      )}
                      <DeleteTripButton tripId={t.id} />
                    </div>
                  </div>

                  {/* Route */}
                  <div className="flex gap-1 items-center flex-wrap text-body-sm text-secondary mb-sm">
                    <span className="material-symbols-outlined text-[16px]">{modeIcon(t.travelToMode)}</span>
                    <span>{modeLabel(t.travelToMode)}</span>
                    <span className="text-surface-container-highest px-1">→</span>
                    <span className="material-symbols-outlined text-[16px]">fitness_center</span>
                    <span className="text-surface-container-highest px-1">→</span>
                    <span className="material-symbols-outlined text-[16px]">{modeIcon(t.travelFromMode)}</span>
                    <span>{modeLabel(t.travelFromMode)}</span>
                  </div>

                  {/* Run stats */}
                  {runDistKm > 0 && (
                    <div className="flex gap-md mb-sm">
                      <div>
                        <p className="text-headline-md text-primary-container">{runDistKm.toFixed(2)}</p>
                        <p className="text-[10px] text-secondary">km</p>
                      </div>
                      {runDurMin > 0 && (
                        <>
                          <div>
                            <p className="text-headline-md text-primary-container">{Math.round(runDurMin)}</p>
                            <p className="text-[10px] text-secondary">min</p>
                          </div>
                          <div>
                            <p className="text-headline-md text-primary-container">{fmtPace(runDurMin, runDistKm)}</p>
                            <p className="text-[10px] text-secondary">pace</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Calorie breakdown */}
                  {totalCal > 0 && (
                    <div className="flex gap-xs flex-wrap">
                      {t.travelToCalories ? (
                        <span className="text-[10px] bg-surface-container-high px-2 py-0.5 rounded text-secondary">
                          To gym: {t.travelToCalories} kcal
                        </span>
                      ) : null}
                      {t.workoutCalories ? (
                        <span className="text-[10px] bg-surface-container-high px-2 py-0.5 rounded text-secondary">
                          Gym: {t.workoutCalories} kcal
                        </span>
                      ) : null}
                      {t.travelFromCalories ? (
                        <span className="text-[10px] bg-surface-container-high px-2 py-0.5 rounded text-secondary">
                          From gym: {t.travelFromCalories} kcal
                        </span>
                      ) : null}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </main>
  )
}
