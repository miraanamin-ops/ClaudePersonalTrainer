'use client'

import { useTransition } from 'react'
import { lockMeal, swapMeal } from '@/app/nutrition/actions'

type Meal = {
  name: string
  kcal: number
  proteinG: number
  fatG: number
  carbsG: number
}

type Props = {
  label: string
  meal: Meal
  slot: 'breakfast' | 'dinner'
  locked: boolean
  icon?: string
}

const slotIcons: Record<string, string> = {
  Breakfast: 'light_mode',
  Dinner:    'dark_mode',
}

export default function MealCard({ label, meal, slot, locked, icon }: Props) {
  const [isPending, startTransition] = useTransition()
  const mealIcon = icon ?? slotIcons[label] ?? 'restaurant'

  return (
    <div className={`bg-surface-container border border-surface-container-highest rounded-xl p-md transition-opacity ${isPending ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-start mb-md">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container">{mealIcon}</span>
          <h3 className="text-headline-md text-on-surface">{label}</h3>
        </div>
        <div className="flex gap-xs">
          <button
            onClick={() => startTransition(() => lockMeal(slot, !locked))}
            disabled={isPending}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high text-secondary hover:text-primary-container transition-colors"
          >
            <span
              className="material-symbols-outlined"
              style={locked ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {locked ? 'lock' : 'lock_open'}
            </span>
          </button>
          <button
            onClick={() => startTransition(() => swapMeal(slot))}
            disabled={isPending}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high text-secondary hover:text-primary-container active:rotate-180 transition-all"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>

      <div className="flex gap-md items-start">
        <div className="flex-1">
          <p className="text-body-lg text-on-surface font-semibold">{meal.name}</p>
          <div className="flex gap-sm mt-xs flex-wrap">
            <span className="text-[10px] bg-surface-container-high px-2 py-0.5 rounded text-secondary font-label-caps">P: {meal.proteinG}g</span>
            <span className="text-[10px] bg-surface-container-high px-2 py-0.5 rounded text-secondary font-label-caps">C: {meal.carbsG}g</span>
            <span className="text-[10px] bg-surface-container-high px-2 py-0.5 rounded text-secondary font-label-caps">F: {meal.fatG}g</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-headline-md text-primary-container">{meal.kcal}</p>
          <p className="text-[10px] text-secondary">KCAL</p>
        </div>
      </div>
    </div>
  )
}
