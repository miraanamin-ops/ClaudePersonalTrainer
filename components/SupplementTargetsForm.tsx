'use client'

import { useState, useTransition } from 'react'
import { saveSupplementTargets } from '@/app/nutrition/actions'

type Props = { waterTargetMl: number; creatineDoseG: number }

export default function SupplementTargetsForm({ waterTargetMl, creatineDoseG }: Props) {
  const [open, setOpen] = useState(false)
  const [water, setWater] = useState(waterTargetMl)
  const [creatine, setCreatine] = useState(creatineDoseG)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => saveSupplementTargets(water, creatine))
  }

  const fields = [
    { label: 'Water', unit: 'ml', value: water,    set: setWater,    step: 250 },
    { label: 'Creatine', unit: 'g', value: creatine, set: setCreatine, step: 1   },
  ]

  return (
    <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[20px]">water_drop</span>
          <span className="text-body-sm text-secondary">Edit water &amp; creatine</span>
        </div>
        <span className="material-symbols-outlined text-secondary text-[18px]">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-md space-y-sm">
          {fields.map(({ label, unit, value, set, step }) => (
            <div key={label} className="flex items-center gap-md">
              <label className="text-label-caps text-secondary w-20 shrink-0">{label.toUpperCase()}</label>
              <div className="flex items-center gap-sm flex-1">
                <input
                  type="number"
                  value={value}
                  onChange={e => set(Number(e.target.value))}
                  inputMode="numeric"
                  step={step}
                  min={0}
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
            {isPending ? 'SAVING…' : 'SAVE'}
          </button>
        </form>
      )}
    </div>
  )
}
