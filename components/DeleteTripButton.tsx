'use client'

import { useState, useTransition } from 'react'
import { deleteTrip } from '@/app/activity/actions'

export default function DeleteTripButton({ tripId }: { tripId: number }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirming) {
    return (
      <div className="flex items-center gap-sm shrink-0">
        <button
          onClick={() => startTransition(() => deleteTrip(tripId))}
          disabled={isPending}
          className="text-error text-label-caps font-bold disabled:opacity-50 active:scale-95 transition-all"
        >
          {isPending ? '…' : 'Delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-secondary text-label-caps"
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-error hover:bg-surface-container-high transition-colors shrink-0"
      aria-label="Delete trip"
    >
      <span className="material-symbols-outlined text-[18px]">delete</span>
    </button>
  )
}
