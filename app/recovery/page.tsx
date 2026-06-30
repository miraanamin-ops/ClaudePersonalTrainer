import { getActiveMesocycle, getReadinessForDate, checkEarlyDeloadTriggers } from '@/lib/prescriptions'
import { getWeeklyTargetRIR } from '@/lib/progression'
import {
  computeDeficitScore,
  readinessCategory,
  rirAdjustment,
  categoryLabel,
  readinessNudges,
} from '@/lib/readiness'
import { prisma } from '@/lib/prisma'
import { getTodaysProteinProgress } from '@/lib/nutrition'
import ReadinessForm from '@/components/ReadinessForm'
import EarlyDeloadButton from '@/components/EarlyDeloadButton'

export const dynamic = 'force-dynamic'

function categoryColor(cat: ReturnType<typeof readinessCategory>) {
  if (cat === 'rest')     return 'text-error'
  if (cat === 'poor')     return 'text-tertiary-container'
  if (cat === 'moderate') return 'text-secondary'
  return 'text-primary-container'
}

function categoryBg(cat: ReturnType<typeof readinessCategory>) {
  if (cat === 'rest') return 'bg-[#2c0005] border border-error/30'
  if (cat === 'poor') return 'bg-surface-container border border-tertiary-container/30'
  return 'bg-surface-container border border-surface-container-highest'
}

export default async function RecoveryPage() {
  const today = new Date()
  const todayReadiness = await getReadinessForDate(today)
  const meso = await getActiveMesocycle()

  let deficit = 0
  let category: ReturnType<typeof readinessCategory> | null = null
  let adj = 0
  if (todayReadiness) {
    deficit = computeDeficitScore(todayReadiness.sleepHours, todayReadiness.soreness, todayReadiness.energy)
    category = readinessCategory(deficit)
    adj = rirAdjustment(category)
  }

  const isDeload  = meso ? meso.currentWeek > meso.lengthWeeks : false
  const isComplete = meso ? meso.currentWeek > meso.lengthWeeks + 1 : false
  const baseRIR   = meso && !isDeload && !isComplete
    ? getWeeklyTargetRIR(meso.blockNumber, meso.currentWeek, meso.lengthWeeks)
    : null
  const prescribedRIR = baseRIR !== null ? Math.min(baseRIR + adj, 5) : null

  let readinessTrigger   = false
  let performanceTrigger = false
  if (meso && !isDeload && !isComplete) {
    const triggers = await checkEarlyDeloadTriggers(meso.id, meso.blockNumber, meso.lengthWeeks)
    readinessTrigger   = triggers.readinessTrigger
    performanceTrigger = triggers.performanceTrigger
  }
  const earlyDeloadFired = readinessTrigger || performanceTrigger

  const [recent, protein] = await Promise.all([
    prisma.readiness.findMany({ orderBy: { date: 'desc' }, take: 3 }),
    getTodaysProteinProgress(),
  ])
  const nudges = readinessNudges(
    recent.map(r => ({ sleepHours: r.sleepHours, soreness: r.soreness, energy: r.energy })),
    protein.targetG,
    protein.consumedG,
  )

  const todayLabel = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <main className="min-h-screen pb-24 px-margin-mobile pt-6 max-w-md mx-auto">
      <div className="mb-lg">
        <h1 className="text-headline-lg-mobile text-on-surface">Recovery</h1>
        <p className="text-label-caps text-secondary mt-0.5">{todayLabel.toUpperCase()}</p>
      </div>

      {/* Check-in card */}
      <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md mb-md">
        {todayReadiness ? (
          <>
            {/* Checked-in summary */}
            <div className="flex items-center justify-between mb-md">
              <h2 className="text-headline-md text-on-surface">Today's check-in</h2>
              {category && (
                <span className={`text-label-caps font-bold ${categoryColor(category)}`}>
                  {categoryLabel(category).toUpperCase()}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-sm mb-md">
              {[
                { icon: 'bedtime', label: 'SLEEP',    value: `${todayReadiness.sleepHours}h` },
                { icon: 'healing', label: 'SORENESS', value: `${todayReadiness.soreness}/5`  },
                { icon: 'bolt',    label: 'ENERGY',   value: `${todayReadiness.energy}/5`    },
              ].map(({ icon, label, value }) => (
                <div key={label} className="bg-surface-container-high rounded-lg py-sm flex flex-col items-center gap-xs">
                  <span className="material-symbols-outlined text-secondary text-[20px]">{icon}</span>
                  <p className="text-label-caps text-secondary">{label}</p>
                  <p className="text-headline-md text-on-surface">{value}</p>
                </div>
              ))}
            </div>
            {todayReadiness.notes && (
              <p className="text-body-sm text-secondary italic mb-md">"{todayReadiness.notes}"</p>
            )}
            <details className="group">
              <summary className="text-label-caps text-secondary cursor-pointer select-none flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">edit</span>
                EDIT CHECK-IN
              </summary>
              <div className="mt-md">
                <ReadinessForm
                  initial={{
                    sleepHours: todayReadiness.sleepHours,
                    soreness:   todayReadiness.soreness,
                    energy:     todayReadiness.energy,
                    notes:      todayReadiness.notes,
                  }}
                />
              </div>
            </details>
          </>
        ) : (
          <>
            <h2 className="text-headline-md text-on-surface mb-lg">How are you feeling?</h2>
            <ReadinessForm />
          </>
        )}
      </div>

      {/* Training guidance */}
      {category && meso && !isComplete && (
        <div className={`rounded-xl p-md mb-md ${categoryBg(category)}`}>
          <p className="text-label-caps text-secondary uppercase mb-md">Today's training</p>

          {category === 'rest' ? (
            <div>
              <div className="flex items-center gap-2 mb-sm">
                <span className="material-symbols-outlined text-error">hotel</span>
                <h3 className="text-headline-md text-error">Rest today</h3>
              </div>
              <p className="text-body-sm text-secondary leading-relaxed">
                Your body is signalling it needs recovery. Skip training, aim for 7–8h sleep tonight and hit your protein target.
              </p>
            </div>
          ) : isDeload ? (
            <div>
              <div className="flex items-center gap-2 mb-sm">
                <span className="material-symbols-outlined text-tertiary-container">self_improvement</span>
                <h3 className="text-headline-md text-tertiary-container">Deload week</h3>
              </div>
              <p className="text-body-sm text-secondary leading-relaxed">
                Cut volume by ~50%, aim for RIR 4+. Keep weights the same — just fewer sets, well short of effort.
              </p>
            </div>
          ) : (
            <div className="space-y-sm">
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-secondary">Readiness</span>
                <span className={`text-label-caps font-bold ${categoryColor(category)}`}>{categoryLabel(category).toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-secondary">Week {meso.currentWeek} base RIR</span>
                <span className="text-headline-md text-on-surface">{baseRIR}</span>
              </div>
              {adj > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-secondary">Readiness adj</span>
                  <span className="text-label-caps font-bold text-tertiary-container">+{adj}</span>
                </div>
              )}
              <div className="border-t border-surface-container-highest pt-sm flex items-center justify-between">
                <span className="text-body-lg text-on-surface font-semibold">Target RIR today</span>
                <span className={`text-display-stat ${adj > 0 ? 'text-tertiary-container' : 'text-primary-container'}`}>
                  {prescribedRIR}
                </span>
              </div>
              {adj > 0 && (
                <p className="text-body-sm text-secondary leading-relaxed">
                  {adj === 1
                    ? 'Same weight — stop 1 rep earlier than usual.'
                    : 'Same weight — stop 2 reps earlier. Consider a lighter session.'}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Early deload banner */}
      {earlyDeloadFired && meso && !isDeload && !isComplete && (
        <div className="bg-[#1c1100] border border-tertiary-container/40 rounded-xl p-md mb-md">
          <div className="flex items-center gap-2 mb-sm">
            <span className="material-symbols-outlined text-tertiary-container">warning</span>
            <h3 className="text-headline-md text-tertiary-container">Reactive deload triggered</h3>
          </div>
          <p className="text-body-sm text-secondary leading-relaxed mb-md">
            {readinessTrigger && performanceTrigger
              ? 'Your last 3 check-ins and recent workout performance both signal accumulated fatigue.'
              : readinessTrigger
              ? 'Your last 3 check-ins have been Moderate or worse — fatigue is accumulating.'
              : 'Your last 2 workouts show RIR grinding below target — performance is dropping.'}
            {' '}Pull your deload forward now.
          </p>
          <EarlyDeloadButton mesocycleId={meso.id} />
        </div>
      )}

      {/* Coaching nudges */}
      {nudges.length > 0 && (
        <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md">
          <div className="flex items-center gap-2 mb-md">
            <span className="material-symbols-outlined text-primary-container">tips_and_updates</span>
            <h3 className="text-headline-md text-on-surface">Coaching nudges</h3>
          </div>
          <div className="space-y-sm">
            {nudges.map((n, i) => (
              <p key={i} className="text-body-sm text-secondary leading-relaxed">{n}</p>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
