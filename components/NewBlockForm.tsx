'use client'

import { useState, useTransition } from 'react'
import { createMesocycle } from '@/app/block/actions'

export default function NewBlockForm({ blockNumber }: { blockNumber: number }) {
  const [lengthWeeks, setLengthWeeks]         = useState(4)
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(3)
  const [isPending, startTransition]          = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => createMesocycle(lengthWeeks, workoutsPerWeek))
  }

  const isBeginner = blockNumber <= 2

  return (
    <form onSubmit={handleSubmit} className="space-y-xl">
      <div>
        <p className="text-label-caps text-secondary mb-sm">BLOCK LENGTH</p>
        <div className="grid grid-cols-3 gap-sm">
          {[4, 5, 6].map(w => (
            <button
              key={w}
              type="button"
              onClick={() => setLengthWeeks(w)}
              className={`py-md rounded-xl text-body-sm font-semibold transition-all active:scale-95 ${
                lengthWeeks === w
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-container-high border border-surface-container-highest text-secondary'
              }`}
            >
              {w} weeks
            </button>
          ))}
        </div>
        <p className="text-body-sm text-secondary mt-sm">
          {isBeginner
            ? 'Beginner block — flat RIR 3, no volume changes.'
            : `Deload auto-scheduled as week ${lengthWeeks + 1}.`}
        </p>
      </div>

      <div>
        <p className="text-label-caps text-secondary mb-sm">SESSIONS PER WEEK</p>
        <div className="grid grid-cols-2 gap-sm">
          {[3, 4].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setWorkoutsPerWeek(n)}
              className={`py-md rounded-xl font-semibold transition-all active:scale-95 ${
                workoutsPerWeek === n
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-container-high border border-surface-container-highest text-secondary'
              }`}
            >
              <span className="text-headline-md block">{n} days</span>
              <span className="text-label-caps font-normal mt-0.5 block">
                {n === 3 ? 'Full Body A/B/A' : 'Upper/Lower ×2'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-surface-container-high border border-surface-container-highest rounded-xl px-md py-sm space-y-xs">
        <div className="flex justify-between">
          <span className="text-body-sm text-secondary">Block</span>
          <span className="text-body-sm text-on-surface font-semibold">{blockNumber} · {lengthWeeks} hard weeks + deload</span>
        </div>
        <div className="flex justify-between">
          <span className="text-body-sm text-secondary">Target RIR</span>
          <span className="text-body-sm text-on-surface font-semibold">
            {isBeginner ? '3 (flat, beginner)' : '3 → 2 → 1 → 0'}
          </span>
        </div>
        {!isBeginner && (
          <div className="flex justify-between">
            <span className="text-body-sm text-secondary">Volume</span>
            <span className="text-body-sm text-on-surface font-semibold">+1 set on compounds from week 3</span>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-14 bg-primary-container text-on-primary-container font-bold rounded-xl flex justify-center items-center gap-2 active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(57,255,20,0.15)] text-label-caps"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
        {isPending ? 'STARTING…' : `START BLOCK ${blockNumber}`}
      </button>
    </form>
  )
}
