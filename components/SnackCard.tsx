'use client'

import { useOptimistic, useTransition } from 'react'
import { markSnackEaten, skipSnack } from '@/app/nutrition/actions'

type Props = {
  snack: {
    id: number
    eaten: boolean
    skipped: boolean
    meal: { name: string; kcal: number; proteinG: number; carbsG: number; fatG: number }
  }
}

export default function SnackCard({ snack }: Props) {
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useOptimistic(
    { eaten: snack.eaten, skipped: snack.skipped },
    (_prev, next: { eaten: boolean; skipped: boolean }) => next,
  )

  function toggleEaten() {
    const next = { eaten: !state.eaten, skipped: false }
    startTransition(async () => {
      setState(next)
      await markSnackEaten(snack.id, next.eaten)
    })
  }

  function toggleSkip() {
    const next = { eaten: false, skipped: !state.skipped }
    startTransition(async () => {
      setState(next)
      await skipSnack(snack.id, next.skipped)
    })
  }

  return (
    <div className={`flex items-center gap-2 bg-surface-container-high p-sm rounded-lg transition-opacity ${state.skipped ? 'opacity-50' : ''}`}>
      <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">nutrition</span>
      <div className="flex-1 min-w-0">
        <p className={`text-body-sm text-on-surface font-semibold truncate ${state.skipped ? 'line-through' : ''}`}>{snack.meal.name}</p>
        <p className="text-[10px] text-secondary truncate">P: {snack.meal.proteinG}g | C: {snack.meal.carbsG}g | F: {snack.meal.fatG}g</p>
      </div>
      <p className="text-headline-md text-primary-container shrink-0">{snack.meal.kcal}</p>
      <div className="flex gap-1 shrink-0">
        {/* Eaten */}
        <button
          onClick={toggleEaten}
          disabled={isPending || state.skipped}
          title={state.eaten ? 'Mark as not eaten' : 'Mark as eaten'}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container text-secondary hover:text-primary-container transition-colors disabled:opacity-30"
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={state.eaten ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            check_circle
          </span>
        </button>
        {/* Skip */}
        <button
          onClick={toggleSkip}
          disabled={isPending || state.eaten}
          title={state.skipped ? 'Un-skip' : "Didn't eat this"}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container text-secondary hover:text-primary-container transition-colors disabled:opacity-30"
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={state.skipped ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            cancel
          </span>
        </button>
      </div>
    </div>
  )
}
