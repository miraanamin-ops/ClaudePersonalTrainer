'use client'

import { useTransition } from 'react'
import { markMealEaten } from '@/app/nutrition/actions'

export default function LunchEatenToggle({ eaten }: { eaten: boolean }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => markMealEaten('lunch', !eaten))}
      disabled={isPending}
      title={eaten ? 'Mark as not eaten' : 'Mark as eaten'}
      className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high text-secondary hover:text-primary-container transition-colors disabled:opacity-50"
    >
      <span
        className="material-symbols-outlined text-[18px]"
        style={eaten ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        check_circle
      </span>
    </button>
  )
}
