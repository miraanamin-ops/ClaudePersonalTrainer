'use client'

import { useOptimistic, useTransition } from 'react'
import { toggleWaterSlot } from '@/app/nutrition/actions'
import type { WaterSlot } from '@/lib/supplements'

type Props = {
  slots: WaterSlot[]
  completedMask: number
  targetMl: number
}

export default function WaterTracker({ slots, completedMask, targetMl }: Props) {
  const [isPending, startTransition] = useTransition()
  const [mask, setMask] = useOptimistic(completedMask, (_prev, next: number) => next)

  const consumedMl = slots.reduce((sum, s) => sum + ((mask & (1 << s.index)) ? s.ml : 0), 0)
  const pct = Math.min(consumedMl / Math.max(targetMl, 1), 1)

  return (
    <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md">
      <div className="flex items-center gap-2 mb-md">
        <span className="material-symbols-outlined text-primary-container">water_drop</span>
        <h3 className="text-headline-md text-on-surface">Water</h3>
        <span className="text-[10px] text-secondary bg-surface-container-high px-2 py-0.5 rounded-full ml-auto">resets daily</span>
      </div>

      {/* Running total */}
      <div className="flex justify-between items-end mb-xs">
        <p className="text-body-lg text-on-surface font-semibold">
          {(consumedMl / 1000).toFixed(2)}<span className="text-secondary text-body-sm font-normal"> / {(targetMl / 1000).toFixed(2)} L</span>
        </p>
        <p className="text-label-caps text-secondary">{Math.round(pct * 100)}%</p>
      </div>
      <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden mb-md">
        <div className="h-full bg-primary-container transition-all duration-500" style={{ width: `${pct * 100}%` }} />
      </div>

      {/* Schedule checklist */}
      <div className="space-y-sm">
        {slots.map(slot => {
          const bit = 1 << slot.index
          const done = !!(mask & bit)
          const toggle = () => {
            const next = done ? mask & ~bit : mask | bit
            startTransition(async () => {
              setMask(next)
              await toggleWaterSlot(slot.index, !done)
            })
          }
          return (
            <button
              key={slot.index}
              onClick={toggle}
              disabled={isPending}
              className={`w-full flex items-center gap-2 bg-surface-container-high p-sm rounded-lg transition-opacity disabled:opacity-50 ${done ? 'opacity-60' : ''}`}
            >
              <span
                className="material-symbols-outlined text-[20px] shrink-0 text-primary-container"
                style={done ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {done ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span className="text-label-caps text-secondary w-12 shrink-0 text-left">{slot.label}</span>
              <span className={`text-body-sm text-on-surface font-semibold flex-1 text-left ${done ? 'line-through' : ''}`}>
                {slot.ml} ml
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
