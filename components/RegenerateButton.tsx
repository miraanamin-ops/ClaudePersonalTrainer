'use client'

import { useTransition } from 'react'
import { generatePlan } from '@/app/nutrition/actions'

export default function RegenerateButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => generatePlan())}
      disabled={isPending}
      className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-secondary hover:text-primary-container active:scale-90 transition-all disabled:opacity-50"
      title="Regenerate plan"
    >
      <span className={`material-symbols-outlined text-[20px] ${isPending ? 'animate-spin' : ''}`}>refresh</span>
    </button>
  )
}
