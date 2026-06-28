import { prisma } from '@/lib/prisma'
import { getActiveMesocycle, isMesocycleComplete } from '@/lib/prescriptions'
import { getWeeklyTargetRIR } from '@/lib/progression'
import BlockControls from '@/components/BlockControls'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function BlockPage() {
  const meso = await getActiveMesocycle()

  if (!meso) {
    return (
      <main className="min-h-screen pb-24 px-margin-mobile max-w-md mx-auto flex flex-col items-center justify-center gap-lg">
        <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center">
          <span className="material-symbols-outlined text-secondary text-5xl">calendar_month</span>
        </div>
        <div className="text-center">
          <h2 className="text-headline-md text-on-surface mb-sm">No active block</h2>
          <p className="text-body-sm text-secondary">Start your first training block to begin periodised lifting.</p>
        </div>
        <Link
          href="/block/new"
          className="h-14 px-xl bg-primary-container text-on-primary-container font-bold rounded-xl flex items-center gap-2 text-label-caps active:scale-95 transition-all shadow-[0_0_20px_rgba(57,255,20,0.2)]"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
          START BLOCK 1
        </Link>
      </main>
    )
  }

  const complete  = isMesocycleComplete(meso)
  const isDeload  = !complete && meso.currentWeek > meso.lengthWeeks
  const isBeginner = meso.blockNumber <= 2
  const targetRIR = getWeeklyTargetRIR(meso.blockNumber, meso.currentWeek, meso.lengthWeeks)

  const sessionsThisWeek = await prisma.workout.count({
    where: { mesocycleId: meso.id, weekInBlock: meso.currentWeek },
  })

  const weekLabel = complete ? 'Block complete'
    : isDeload ? 'Deload week'
    : `Week ${meso.currentWeek} of ${meso.lengthWeeks}`

  return (
    <main className="min-h-screen pb-24 px-margin-mobile pt-6 max-w-md mx-auto">
      <div className="mb-lg">
        <h1 className="text-headline-lg-mobile text-on-surface">
          Block {meso.blockNumber}{isBeginner ? ' — Beginner' : ''}
        </h1>
        <p className="text-label-caps text-secondary mt-0.5">{weekLabel.toUpperCase()}</p>
      </div>

      {complete ? (
        <div className="space-y-md">
          <div className="bg-surface-container border border-primary-container/30 rounded-xl p-md text-center">
            <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center mx-auto mb-md">
              <span className="material-symbols-outlined text-primary-container text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
            </div>
            <h2 className="text-headline-md text-primary-container mb-xs">Block complete!</h2>
            <p className="text-body-sm text-secondary">Deload done. Time to start the next block.</p>
          </div>
          <Link
            href="/block/new"
            className="block w-full h-14 bg-primary-container text-on-primary-container font-bold rounded-xl flex items-center justify-center gap-2 text-label-caps active:scale-95 transition-all shadow-[0_0_20px_rgba(57,255,20,0.2)]"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            START BLOCK {meso.blockNumber + 1}
          </Link>
        </div>
      ) : (
        <div className="space-y-md">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-sm">
            <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md flex flex-col items-center">
              <span className="text-label-caps text-secondary mb-xs">TARGET RIR</span>
              <span className={`text-display-stat ${isDeload ? 'text-tertiary-container' : 'text-primary-container'}`}>
                {targetRIR}
              </span>
            </div>
            <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md flex flex-col items-center">
              <span className="text-label-caps text-secondary mb-xs">SESSIONS</span>
              <div className="flex items-baseline gap-0.5">
                <span className={`text-display-stat ${sessionsThisWeek >= meso.workoutsPerWeek ? 'text-primary-container' : 'text-on-surface'}`}>
                  {sessionsThisWeek}
                </span>
                <span className="text-label-caps text-secondary">/{meso.workoutsPerWeek}</span>
              </div>
            </div>
            <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md flex flex-col items-center">
              <span className="text-label-caps text-secondary mb-xs">PHASE</span>
              <span className={`text-label-caps font-bold mt-1 ${
                isBeginner ? 'text-secondary'
                : isDeload  ? 'text-tertiary-container'
                : 'text-primary-container'
              }`}>
                {isBeginner ? 'BEGINNER' : isDeload ? 'DELOAD' : 'BUILD'}
              </span>
            </div>
          </div>

          {/* Block timeline */}
          <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md">
            <p className="text-label-caps text-secondary mb-sm">BLOCK PROGRESS</p>
            <div className="flex gap-xs">
              {Array.from({ length: meso.lengthWeeks }, (_, i) => {
                const w = i + 1
                const past    = w < meso.currentWeek
                const current = w === meso.currentWeek && !isDeload
                return (
                  <div
                    key={w}
                    className={`flex-1 rounded py-xs text-center text-[10px] font-bold transition-colors ${
                      current ? 'bg-primary-container text-on-primary-container'
                      : past   ? 'bg-surface-container-high text-secondary'
                      :          'bg-surface-container-highest text-secondary opacity-40'
                    }`}
                  >
                    W{w}
                  </div>
                )
              })}
              <div
                className={`flex-1 rounded py-xs text-center text-[10px] font-bold transition-colors ${
                  isDeload ? 'bg-tertiary-container text-on-tertiary' : 'bg-surface-container-highest text-secondary opacity-40'
                }`}
              >
                DL
              </div>
            </div>
          </div>

          {/* RIR schedule */}
          {!isBeginner && !isDeload && (
            <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md">
              <p className="text-label-caps text-secondary mb-sm">RIR SCHEDULE</p>
              <div className="flex gap-sm">
                {Array.from({ length: meso.lengthWeeks }, (_, i) => {
                  const w = i + 1
                  const rir = getWeeklyTargetRIR(meso.blockNumber, w, meso.lengthWeeks)
                  const current = w === meso.currentWeek
                  return (
                    <div key={w} className={`flex-1 text-center ${current ? 'opacity-100' : 'opacity-40'}`}>
                      <p className="text-label-caps text-secondary">W{w}</p>
                      <p className={`text-headline-md mt-0.5 ${current ? 'text-primary-container' : 'text-on-surface'}`}>{rir}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <BlockControls
            mesocycleId={meso.id}
            currentWeek={meso.currentWeek}
            lengthWeeks={meso.lengthWeeks}
            sessionsThisWeek={sessionsThisWeek}
            workoutsPerWeek={meso.workoutsPerWeek}
            isDeload={isDeload}
            isComplete={complete}
          />
        </div>
      )}
    </main>
  )
}
