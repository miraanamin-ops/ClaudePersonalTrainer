'use client'

import { useTransition } from 'react'
import { markMealEaten, skipMeal } from '@/app/nutrition/actions'

type Props = { eaten: boolean; skipped: boolean }

export default function LunchEatenToggle({ eaten, skipped }: Props) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex gap-xs">
      <button
        onClick={() => startTransition(() => markMealEaten('lunch', !eaten))}
        disabled={isPending || skipped}
        title={eaten ? 'Mark as not eaten' : 'Mark as eaten'}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high text-secondary hover:text-primary-container transition-colors disabled:opacity-30"
      >
        <span className="material-symbols-outlined text-[18px]" style={eaten ? { fontVariationSettings: "'FILL' 1" } : undefined}>
          check_circle
        </span>
      </button>
      <button
        onClick={() => startTransition(() => skipMeal('lunch', !skipped))}
        disabled={isPending || eaten}
        title={skipped ? 'Un-skip' : "Didn't eat this"}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high text-secondary hover:text-primary-container transition-colors disabled:opacity-30"
      >
        <span className="material-symbols-outlined text-[18px]" style={skipped ? { fontVariationSettings: "'FILL' 1" } : undefined}>
          cancel
        </span>
      </button>
    </div>
  )
}
