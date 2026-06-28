'use client'

import { useTransition } from 'react'
import { triggerEarlyDeload } from '@/app/block/actions'

export default function EarlyDeloadButton({ mesocycleId }: { mesocycleId: number }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => triggerEarlyDeload(mesocycleId))}
      disabled={isPending}
      className="w-full h-12 bg-tertiary-container text-on-tertiary font-bold rounded-lg flex justify-center items-center gap-sm active:scale-95 transition-all disabled:opacity-50 text-label-caps"
    >
      <span className="material-symbols-outlined text-[18px]">fast_forward</span>
      {isPending ? 'APPLYING…' : 'PULL FORWARD DELOAD'}
    </button>
  )
}
