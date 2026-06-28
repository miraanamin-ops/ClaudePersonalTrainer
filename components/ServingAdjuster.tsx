'use client'

import { useState, useEffect } from 'react'

const SHOPPING_KEY = 'shopping-ticked-v1'

const STEPS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3]

type Macros = { kcal: number; proteinG: number; fatG: number; carbsG: number }
type Ingredient = { name: string; quantity: number; unit: string; aisle?: string }

type Props = {
  meal: Macros
  ingredients: Ingredient[]
  instructions: string[]
  initialScale: number
  showShoppingStatus?: boolean
}

function fmtQty(n: number): string {
  // Show as a fraction or decimal, avoiding trailing zeros
  if (n % 1 === 0) return String(n)
  const rounded = Math.round(n * 4) / 4  // nearest 0.25
  if (rounded % 1 === 0) return String(rounded)
  return rounded.toFixed(2).replace(/\.?0+$/, '')
}

export default function ServingAdjuster({ meal, ingredients, instructions, initialScale, showShoppingStatus }: Props) {
  const snapInitial = STEPS.reduce((prev, curr) =>
    Math.abs(curr - initialScale) < Math.abs(prev - initialScale) ? curr : prev,
  )
  const [scale, setScale] = useState(snapInitial)
  const [ticked, setTicked] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!showShoppingStatus) return
    try {
      const stored = localStorage.getItem(SHOPPING_KEY)
      if (stored) setTicked(new Set(JSON.parse(stored) as string[]))
    } catch {}
  }, [showShoppingStatus])

  const idx = STEPS.indexOf(scale)
  const canDown = idx > 0
  const canUp   = idx < STEPS.length - 1

  const scaledKcal    = Math.round(meal.kcal    * scale)
  const scaledProtein = +(meal.proteinG * scale).toFixed(1)
  const scaledFat     = +(meal.fatG     * scale).toFixed(1)
  const scaledCarbs   = +(meal.carbsG   * scale).toFixed(1)

  return (
    <>
      {/* Serving size adjuster */}
      <div className="flex items-center justify-between bg-surface-container-high rounded-xl p-md mb-lg">
        <button
          onClick={() => setScale(STEPS[idx - 1])}
          disabled={!canDown}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container text-on-surface text-xl disabled:opacity-30 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">remove</span>
        </button>
        <div className="text-center">
          <p className="text-display-stat text-on-surface font-bold leading-none">{scale}×</p>
          <p className="text-label-caps text-secondary mt-1">SERVING SIZE</p>
        </div>
        <button
          onClick={() => setScale(STEPS[idx + 1])}
          disabled={!canUp}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container text-on-surface text-xl disabled:opacity-30 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      {/* Scaled macros */}
      <div className="grid grid-cols-4 gap-sm mb-lg">
        {[
          { label: 'KCAL',    value: scaledKcal,    unit: ''  },
          { label: 'PROTEIN', value: scaledProtein, unit: 'g' },
          { label: 'FAT',     value: scaledFat,     unit: 'g' },
          { label: 'CARBS',   value: scaledCarbs,   unit: 'g' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="bg-surface-container-high rounded-xl p-sm text-center">
            <p className="text-headline-md text-primary-container font-bold">{value}{unit}</p>
            <p className="text-[9px] text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Ingredients */}
      <h2 className="text-headline-md text-on-surface mb-sm">Ingredients</h2>
      <div className="space-y-xs mb-lg">
        {ingredients.map((ing, i) => {
          const shoppingKey = ing.aisle ? `${ing.aisle}|||${ing.name}` : null
          const isBought = shoppingKey ? ticked.has(shoppingKey) : true
          const needsToBuy = showShoppingStatus && !isBought
          return (
            <div key={i} className={`flex items-center justify-between rounded-lg px-md py-sm ${needsToBuy ? 'bg-error/10' : 'bg-surface-container-high'}`}>
              <span className={`text-body-sm ${needsToBuy ? 'text-error font-medium' : 'text-on-surface'}`}>
                {ing.name}
              </span>
              <span className={`text-body-sm font-semibold shrink-0 ml-sm ${needsToBuy ? 'text-error' : 'text-primary-container'}`}>
                {fmtQty(ing.quantity * scale)} {ing.unit}
              </span>
            </div>
          )
        })}
      </div>
      {showShoppingStatus && ingredients.some(ing => ing.aisle && !ticked.has(`${ing.aisle}|||${ing.name}`)) && (
        <p className="text-body-sm text-error mb-lg flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
          Red items are not yet ticked in your shopping list.
        </p>
      )}

      {/* Instructions */}
      {instructions.length > 0 && (
        <>
          <h2 className="text-headline-md text-on-surface mb-sm">Method</h2>
          <ol className="space-y-sm">
            {instructions.map((step, i) => (
              <li key={i} className="flex gap-md bg-surface-container-high rounded-xl p-md">
                <span className="text-label-caps text-primary-container font-bold shrink-0 mt-0.5 w-4">{i + 1}</span>
                <p className="text-body-sm text-on-surface leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </>
      )}
    </>
  )
}
