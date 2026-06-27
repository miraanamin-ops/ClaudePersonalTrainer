'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addSet, deleteSet } from '@/app/workouts/actions'

type LoggedSet = {
  id: number
  setNumber: number
  weightKg: number
  reps: number
  rir: number
}

type ExerciseInfo = {
  id: number
  name: string
  muscleGroup: string
  repRangeLow: number
  repRangeHigh: number
}

type Props = {
  workoutId: number
  exercise: ExerciseInfo
  targetSets: number
  loggedSets: LoggedSet[]
}

export default function WorkoutExercise({ workoutId, exercise, targetSets, loggedSets }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const last = loggedSets[loggedSets.length - 1]
  const [weight, setWeight] = useState(last ? String(last.weightKg) : '')
  const [reps, setReps] = useState(last ? String(last.reps) : '')
  const [rir, setRir] = useState(last ? String(last.rir) : '2')

  function handleAdd() {
    if (!weight || !reps || rir === '') return
    const nextNum = loggedSets.length + 1
    startTransition(async () => {
      await addSet(workoutId, exercise.id, nextNum, parseFloat(weight), parseInt(reps), parseInt(rir))
      router.refresh()
    })
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      await deleteSet(id, workoutId)
      router.refresh()
    })
  }

  const done = loggedSets.length >= targetSets

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="font-semibold">{exercise.name}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {exercise.muscleGroup} · {exercise.repRangeLow}–{exercise.repRangeHigh} reps
          </p>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${done ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
          {loggedSets.length}/{targetSets}
        </span>
      </div>

      {/* Logged sets */}
      {loggedSets.length > 0 && (
        <div className="mb-3 border border-gray-800 rounded-lg overflow-hidden">
          <div className="grid grid-cols-[1.25rem_1fr_1fr_1fr_1.5rem] gap-x-2 px-3 py-1.5 text-xs text-gray-500 bg-gray-800/50">
            <span>#</span><span>kg</span><span>reps</span><span>RIR</span><span />
          </div>
          {loggedSets.map((s, idx) => (
            <div
              key={s.id}
              className="grid grid-cols-[1.25rem_1fr_1fr_1fr_1.5rem] gap-x-2 items-center px-3 py-2.5 text-sm border-t border-gray-800"
            >
              <span className="text-gray-500">{idx + 1}</span>
              <span className="font-medium">{s.weightKg}</span>
              <span className="font-medium">{s.reps}</span>
              <span className="font-medium">{s.rir}</span>
              <button
                onClick={() => handleDelete(s.id)}
                disabled={isPending}
                className="text-gray-600 hover:text-red-400 disabled:opacity-30 text-base leading-none text-right"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add set row */}
      <div className="flex gap-2">
        <input
          type="number"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          placeholder="kg"
          step="0.5"
          min="0"
          inputMode="decimal"
          className="flex-1 min-w-0 bg-gray-800 rounded-lg px-2 py-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          type="number"
          value={reps}
          onChange={e => setReps(e.target.value)}
          placeholder="reps"
          min="1"
          max="99"
          inputMode="numeric"
          className="flex-1 min-w-0 bg-gray-800 rounded-lg px-2 py-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          type="number"
          value={rir}
          onChange={e => setRir(e.target.value)}
          placeholder="RIR"
          min="0"
          max="9"
          inputMode="numeric"
          className="flex-1 min-w-0 bg-gray-800 rounded-lg px-2 py-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={handleAdd}
          disabled={isPending || !weight || !reps || rir === ''}
          className="px-4 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-40 rounded-lg text-sm font-semibold transition-colors shrink-0"
        >
          Add
        </button>
      </div>
    </div>
  )
}
