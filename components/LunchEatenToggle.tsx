'use client'

import { useOptimistic, useTransition } from 'react'
import { markMealEaten, skipMeal } from '@/app/nutrition/actions'

type Props = { eaten: boolean; skipped: boolean }

export default function LunchEatenToggle({ eaten, skipped }: Props) {
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useOptimistic(
    { eaten, skipped },
    (_prev, next: { eaten: boolean; skipped: boolean }) => next,
  )

  function toggleEaten() {
    const next = { eaten: !state.eaten, skipped: false }
    startTransition(async () => {
      setState(next)
      await markMealEaten('lunch', next.eaten)
    })
  }

  function toggleSkip() {
    const next = { eaten: false, skipped: !state.skipped }
    startTransition(async () => {
      setState(next)
      await skipMeal('lunch', next.skipped)
    })
  }

  return (
    <div className="flex gap-xs">
      <button
        onClick={toggleEaten}
        disabled={isPending || state.skipped}
        title={state.eaten ? 'Mark as not eaten' : 'Mark as eaten'}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high text-secondary hover:text-primary-container transition-colors disabled:opacity-30"
      >
        <span className="material-symbols-outlined text-[18px]" style={state.eaten ? { fontVariationSettings: "'FILL' 1" } : undefined}>
          check_circle
        </span>
      </button>
      <button
        onClick={toggleSkip}
        disabled={isPending || state.eaten}
        title={state.skipped ? 'Un-skip' : "Didn't eat this"}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high text-secondary hover:text-primary-container transition-colors disabled:opacity-30"
      >
        <span className="material-symbols-outlined text-[18px]" style={state.skipped ? { fontVariationSettings: "'FILL' 1" } : undefined}>
          cancel
        </span>
      </button>
    </div>
  )
}
