'use client'

import { useState, useTransition } from 'react'
import { logReadiness } from '@/app/recovery/actions'

type Props = {
  initial?: {
    sleepHours: number
    soreness: number
    energy: number
    notes: string | null
  }
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  lowLabel,
  highLabel,
  unit,
  icon,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  lowLabel: string
  highLabel: string
  unit?: string
  icon: string
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-xs">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-[18px]">{icon}</span>
          <label className="text-label-caps text-secondary uppercase">{label}</label>
        </div>
        <span className="text-headline-md text-on-surface">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full my-sm"
      />
      <div className="flex justify-between text-label-caps text-secondary mt-xs">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  )
}

export default function ReadinessForm({ initial }: Props) {
  const [sleep, setSleep]     = useState(initial?.sleepHours ?? 7)
  const [soreness, setSoreness] = useState(initial?.soreness ?? 1)
  const [energy, setEnergy]   = useState(initial?.energy ?? 3)
  const [note, setNote]       = useState(initial?.notes ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => logReadiness(sleep, soreness, energy, note))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-xl">
      <SliderField
        label="Sleep"
        icon="bedtime"
        value={sleep}
        onChange={setSleep}
        min={3}
        max={12}
        step={0.5}
        lowLabel="3h"
        highLabel="12h"
        unit="h"
      />
      <SliderField
        label="Soreness"
        icon="healing"
        value={soreness}
        onChange={setSoreness}
        min={1}
        max={5}
        step={1}
        lowLabel="None"
        highLabel="Very sore"
      />
      <SliderField
        label="Energy"
        icon="bolt"
        value={energy}
        onChange={setEnergy}
        min={1}
        max={5}
        step={1}
        lowLabel="Exhausted"
        highLabel="Great"
      />

      <div>
        <label className="text-label-caps text-secondary uppercase block mb-xs">
          Note <span className="normal-case font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. legs still sore from Monday"
          className="w-full bg-surface-container-high border border-surface-container-highest rounded-lg px-md py-3 text-body-sm text-on-surface focus:outline-none focus:border-primary-container transition-colors placeholder:text-secondary"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-14 bg-primary-container text-on-primary-container font-bold rounded-xl flex justify-center items-center gap-sm active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(57,255,20,0.15)]"
      >
        <span className="text-label-caps">
          {isPending ? 'SAVING…' : initial ? 'UPDATE CHECK-IN' : 'LOG READINESS'}
        </span>
      </button>
    </form>
  )
}
