'use client'

import { useState, useTransition } from 'react'
import { saveTargets } from '@/app/nutrition/actions'
import type { NutritionTargets } from '@/lib/nutrition'

export default function TargetsForm({ targets }: { targets: NutritionTargets }) {
  const [open, setOpen] = useState(false)
  const [kcal,    setKcal]    = useState(targets.kcal)
  const [protein, setProtein] = useState(targets.proteinG)
  const [fat,     setFat]     = useState(targets.fatG)
  const [carbs,   setCarbs]   = useState(targets.carbsG)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => saveTargets(kcal, protein, fat, carbs))
  }

  const fields = [
    { label: 'Calories', unit: 'kcal', value: kcal,    set: setKcal    },
    { label: 'Protein',  unit: 'g',    value: protein,  set: setProtein },
    { label: 'Fat',      unit: 'g',    value: fat,      set: setFat     },
    { label: 'Carbs',    unit: 'g',    value: carbs,    set: setCarbs   },
  ]

  return (
    <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[20px]">tune</span>
          <span className="text-body-sm text-secondary">Edit targets</span>
        </div>
        <span className="material-symbols-outlined text-secondary text-[18px]">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-md space-y-sm">
          {fields.map(({ label, unit, value, set }) => (
            <div key={label} className="flex items-center gap-md">
              <label className="text-label-caps text-secondary w-20 shrink-0">{label.toUpperCase()}</label>
              <div className="flex items-center gap-sm flex-1">
                <input
                  type="number"
                  value={value}
                  onChange={e => set(Number(e.target.value))}
                  inputMode="numeric"
                  className="flex-1 bg-surface-container-high border border-surface-container-highest rounded-lg px-md py-2.5 text-body-sm text-on-surface focus:outline-none focus:border-primary-container transition-colors"
                />
                <span className="text-label-caps text-secondary w-8">{unit}</span>
              </div>
            </div>
          ))}
          <button
            type="submit"
            disabled={isPending}
            className="w-full h-12 bg-primary-container text-on-primary-container font-bold rounded-lg flex justify-center items-center text-label-caps mt-sm active:scale-95 transition-all disabled:opacity-50"
          >
            {isPending ? 'SAVING & REGENERATING…' : 'SAVE TARGETS'}
          </button>
        </form>
      )}
    </div>
  )
}
