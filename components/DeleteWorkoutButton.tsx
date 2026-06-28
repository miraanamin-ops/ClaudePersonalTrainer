'use client'

import { useState, useTransition } from 'react'
import { deleteWorkout } from '@/app/workouts/actions'

type Props = {
  workoutId: number
  variant: 'cancel' | 'delete'
}

export default function DeleteWorkoutButton({ workoutId, variant }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(() => deleteWorkout(workoutId))
  }

  if (variant === 'cancel') {
    return confirming ? (
      <div className="flex items-center gap-sm">
        <span className="text-body-sm text-secondary">Discard session?</span>
        <button
          onClick={handleConfirm}
          disabled={isPending}
          className="text-error text-label-caps font-bold disabled:opacity-50 active:scale-95 transition-all"
        >
          {isPending ? 'Discarding…' : 'Discard'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-secondary text-label-caps"
        >
          Keep
        </button>
      </div>
    ) : (
      <button
        onClick={() => setConfirming(true)}
        className="text-secondary text-label-caps hover:text-error transition-colors"
      >
        Cancel
      </button>
    )
  }

  // variant === 'delete'
  return confirming ? (
    <div className="flex items-center gap-sm shrink-0" onClick={e => e.preventDefault()}>
      <button
        onClick={handleConfirm}
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
  ) : (
    <button
      onClick={e => { e.preventDefault(); setConfirming(true) }}
      className="w-9 h-9 rounded-full flex items-center justify-center text-secondary hover:text-error hover:bg-surface-container-high transition-colors shrink-0"
      aria-label="Delete workout"
    >
      <span className="material-symbols-outlined text-[18px]">delete</span>
    </button>
  )
}
