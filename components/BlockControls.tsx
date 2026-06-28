'use client'

import { useTransition } from 'react'
import { advanceWeek, triggerEarlyDeload } from '@/app/block/actions'

type Props = {
  mesocycleId: number
  currentWeek: number
  lengthWeeks: number
  sessionsThisWeek: number
  workoutsPerWeek: number
  isDeload: boolean
  isComplete: boolean
}

export default function BlockControls({
  mesocycleId,
  currentWeek,
  lengthWeeks,
  sessionsThisWeek,
  workoutsPerWeek,
  isDeload,
  isComplete,
}: Props) {
  const [isPending, startTransition] = useTransition()

  if (isComplete) return null

  const canAdvance = sessionsThisWeek >= workoutsPerWeek
  const nextWeek = currentWeek + 1
  const nextLabel = nextWeek > lengthWeeks ? 'Deload week' : `Week ${nextWeek}`

  return (
    <div className="space-y-sm">
      {!isDeload && (
        <>
          <button
            onClick={() => startTransition(() => advanceWeek(mesocycleId))}
            disabled={!canAdvance || isPending}
            className="w-full h-14 bg-primary-container text-on-primary-container font-bold rounded-xl flex justify-center items-center gap-2 active:scale-95 transition-all disabled:opacity-40 text-label-caps shadow-[0_0_14px_rgba(57,255,20,0.15)]"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            {isPending ? 'SAVING…' : `COMPLETE WEEK ${currentWeek} → ${nextLabel.toUpperCase()}`}
          </button>
          {!canAdvance && (
            <p className="text-center text-label-caps text-secondary">
              {sessionsThisWeek}/{workoutsPerWeek} sessions done this week
            </p>
          )}
          <button
            onClick={() => startTransition(() => triggerEarlyDeload(mesocycleId))}
            disabled={isPending}
            className="w-full h-12 bg-surface-container-high border border-tertiary-container/40 rounded-xl flex justify-center items-center gap-2 text-tertiary-container text-label-caps active:scale-95 transition-all disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[18px]">fast_forward</span>
            PULL FORWARD DELOAD
          </button>
        </>
      )}
      {isDeload && (
        <>
          <button
            onClick={() => startTransition(() => advanceWeek(mesocycleId))}
            disabled={!canAdvance || isPending}
            className="w-full h-14 bg-primary-container text-on-primary-container font-bold rounded-xl flex justify-center items-center gap-2 active:scale-95 transition-all disabled:opacity-40 text-label-caps shadow-[0_0_14px_rgba(57,255,20,0.15)]"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>
            {isPending ? 'SAVING…' : 'END DELOAD — BLOCK COMPLETE'}
          </button>
          {!canAdvance && (
            <p className="text-center text-label-caps text-secondary">
              {sessionsThisWeek}/{workoutsPerWeek} deload sessions done
            </p>
          )}
        </>
      )}
    </div>
  )
}
