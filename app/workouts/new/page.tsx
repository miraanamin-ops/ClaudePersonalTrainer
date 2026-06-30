import { prisma } from '@/lib/prisma'
import { getActiveMesocycle, isMesocycleComplete } from '@/lib/prescriptions'
import { getConditioningStatus } from '@/lib/conditioningStatus'
import { startConditioning } from '@/app/conditioning/actions'
import TemplateSelector from '@/components/TemplateSelector'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewWorkoutPage() {
  const [templates, meso] = await Promise.all([
    prisma.workoutTemplate.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } }),
    getActiveMesocycle(),
  ])

  const noBlock = !meso || isMesocycleComplete(meso)

  if (noBlock) {
    return (
      <main className="min-h-screen pb-24 px-margin-mobile max-w-md mx-auto flex flex-col items-center justify-center gap-lg">
        <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center">
          <span className="material-symbols-outlined text-secondary text-5xl">calendar_month</span>
        </div>
        <div className="text-center">
          <h2 className="text-headline-md text-on-surface mb-sm">
            {meso ? 'Block complete' : 'No active block'}
          </h2>
          <p className="text-body-sm text-secondary">
            {meso ? 'Your last training block is complete.' : 'No training block active.'}
            {' '}Start a new block first.
          </p>
        </div>
        <Link
          href="/block/new"
          className="h-14 px-xl bg-primary-container text-on-primary-container font-bold rounded-xl flex items-center gap-2 text-label-caps active:scale-95 transition-all shadow-[0_0_20px_rgba(57,255,20,0.2)]"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
          START NEW BLOCK
        </Link>
      </main>
    )
  }

  // Work out which template is next in rotation.
  // Look at the last workout logged in this block and cycle to the next template.
  const lastWorkout = await prisma.workout.findFirst({
    where: { mesocycleId: meso.id },
    orderBy: { date: 'desc' },
    select: { templateId: true },
  })

  let recommendedId: number | null = null
  if (templates.length > 0) {
    const lastIndex = lastWorkout
      ? templates.findIndex(t => t.id === lastWorkout.templateId)
      : -1
    const nextIndex = (lastIndex + 1) % templates.length
    recommendedId = templates[nextIndex].id
  }

  const isDeload = meso.currentWeek > meso.lengthWeeks
  const weekLabel = isDeload ? 'Deload week' : `Week ${meso.currentWeek} of ${meso.lengthWeeks}`

  const conditioning = await getConditioningStatus()

  return (
    <main className="min-h-screen pb-24 px-margin-mobile pt-6 max-w-md mx-auto">
      <h1 className="text-headline-lg-mobile text-on-surface mb-xs">Start Workout</h1>
      <div className="flex items-center gap-2 mb-xl">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          isDeload
            ? 'bg-tertiary-container/20 text-tertiary-container'
            : 'bg-primary-container/20 text-primary-container'
        }`}>
          {isDeload ? 'DELOAD' : 'ACTIVE'}
        </span>
        <span className="text-body-sm text-secondary">Block {meso.blockNumber} · {weekLabel}</span>
      </div>

      {/* Conditioning is due — surfaced as next-up, on top of the lifting rotation */}
      {conditioning.due && (
        <div className="mb-xl">
          <p className="text-label-caps text-secondary mb-sm">CONDITIONING DUE</p>
          <form action={startConditioning}>
            <button
              type="submit"
              className="w-full bg-[#0a1c00] border border-primary-container/40 rounded-xl p-lg text-left active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between gap-md">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-xs">
                    <span className="material-symbols-outlined text-primary-container text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    <span className="text-label-caps text-primary-container">{conditioning.wod.format}</span>
                  </div>
                  <p className="text-headline-lg-mobile text-primary-container">{conditioning.wod.title}</p>
                  <p className="text-body-sm text-secondary mt-xs">
                    {conditioning.wod.prescription.slice(0, 3).join(' · ')}
                    {conditioning.wod.prescription.length > 3 ? ' …' : ''}
                  </p>
                </div>
                <span
                  className="material-symbols-outlined text-primary-container shrink-0"
                  style={{ fontSize: 48, fontVariationSettings: "'FILL' 1" }}
                >
                  play_circle
                </span>
              </div>
            </button>
          </form>
          <p className="text-[11px] text-secondary mt-sm">
            {conditioning.liftsSinceLast} lifts since your last conditioning session · or train as normal below
          </p>
        </div>
      )}

      <TemplateSelector templates={templates} recommendedId={recommendedId} />
    </main>
  )
}
