'use client'

import { useOptimistic, useTransition } from 'react'
import Link from 'next/link'
import { lockMeal, swapMeal, markMealEaten, skipMeal } from '@/app/nutrition/actions'

type Meal = {
  name: string
  kcal: number
  proteinG: number
  fatG: number
  carbsG: number
}

type Props = {
  label: string
  meal: Meal & { id: number }
  slot: 'breakfast' | 'dinner'
  locked: boolean
  eaten: boolean
  skipped: boolean
  recipeScale?: number
  icon?: string
}

const slotIcons: Record<string, string> = {
  Breakfast: 'light_mode',
  Dinner:    'dark_mode',
}

export default function MealCard({ label, meal, slot, locked, eaten, skipped, recipeScale = 1, icon }: Props) {
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useOptimistic(
    { eaten, skipped, locked },
    (_prev, next: { eaten: boolean; skipped: boolean; locked: boolean }) => next,
  )
  const mealIcon = icon ?? slotIcons[label] ?? 'restaurant'

  function toggleEaten() {
    const next = { ...state, eaten: !state.eaten, skipped: false }
    startTransition(async () => {
      setState(next)
      await markMealEaten(slot, next.eaten)
    })
  }

  function toggleSkip() {
    const next = { ...state, eaten: false, skipped: !state.skipped }
    startTransition(async () => {
      setState(next)
      await skipMeal(slot, next.skipped)
    })
  }

  function toggleLock() {
    const next = { ...state, locked: !state.locked }
    startTransition(async () => {
      setState(next)
      await lockMeal(slot, next.locked)
    })
  }

  function handleSwap() {
    startTransition(() => swapMeal(slot))
  }

  return (
    <div className={`bg-surface-container border border-surface-container-highest rounded-xl p-md transition-opacity ${isPending ? 'opacity-50' : ''} ${state.skipped ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-start gap-sm mb-md">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-primary-container shrink-0">{mealIcon}</span>
          <h3 className={`text-headline-md text-on-surface truncate ${state.skipped ? 'line-through text-secondary' : ''}`}>{label}</h3>
          {state.eaten && !state.skipped && (
            <span className="text-[10px] text-secondary bg-surface-container-high px-2 py-0.5 rounded-full shrink-0">eaten</span>
          )}
          {state.skipped && (
            <span className="text-[10px] text-secondary bg-surface-container-high px-2 py-0.5 rounded-full shrink-0">skipped</span>
          )}
        </div>
        <div className="flex gap-xs shrink-0">
          {/* Eaten */}
          <button
            onClick={toggleEaten}
            disabled={isPending || state.skipped}
            title={state.eaten ? 'Mark as not eaten' : 'Mark as eaten'}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-container-high text-secondary hover:text-primary-container transition-colors disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[20px]" style={state.eaten ? { fontVariationSettings: "'FILL' 1" } : undefined}>
              check_circle
            </span>
          </button>
          {/* Skip */}
          <button
            onClick={toggleSkip}
            disabled={isPending || state.eaten}
            title={state.skipped ? 'Un-skip' : "Didn't eat this"}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-container-high text-secondary hover:text-primary-container transition-colors disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[20px]" style={state.skipped ? { fontVariationSettings: "'FILL' 1" } : undefined}>
              cancel
            </span>
          </button>
          {/* Lock */}
          <button
            onClick={toggleLock}
            disabled={isPending || state.skipped}
            title={state.locked ? 'Unlock' : 'Lock'}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-container-high text-secondary hover:text-primary-container transition-colors disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[20px]" style={state.locked ? { fontVariationSettings: "'FILL' 1" } : undefined}>
              {state.locked ? 'lock' : 'lock_open'}
            </span>
          </button>
          {/* Swap */}
          <button
            onClick={handleSwap}
            disabled={isPending || state.eaten || state.skipped}
            title="Swap meal"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-container-high text-secondary hover:text-primary-container active:rotate-180 transition-all disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
          </button>
        </div>
      </div>

      <div className={`flex gap-md items-start ${state.skipped ? 'opacity-50' : ''}`}>
        <div className="flex-1 min-w-0">
          <p className={`text-body-lg text-on-surface font-semibold ${state.skipped ? 'line-through' : ''}`}>{meal.name}</p>
          <Link
            href={`/nutrition/meals/${meal.id}?scale=${recipeScale.toFixed(2)}`}
            className="flex items-center gap-0.5 text-[10px] text-secondary hover:text-primary-container transition-colors mt-0.5 w-fit"
          >
            <span className="material-symbols-outlined text-[12px]">menu_book</span>
            View recipe
          </Link>
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
