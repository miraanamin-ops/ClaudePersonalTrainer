'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addSet, deleteSet } from '@/app/workouts/actions'
import type { Prescription } from '@/lib/prescriptions'

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
  prescription: Prescription | null
  loggedSets: LoggedSet[]
}

function prescriptionStyle(p: Prescription): { bg: string; text: string } {
  if (p.isDeload)           return { bg: 'bg-[#1c1100] border border-tertiary-container/30', text: 'text-tertiary-container' }
  if (p.earlyDeloadWarning) return { bg: 'bg-[#1c1100] border border-tertiary-container/30', text: 'text-tertiary-container' }
  if (p.action === 'increase') return { bg: 'bg-[#0a1c00] border border-primary-container/30', text: 'text-primary-container' }
  return { bg: 'bg-surface-container-high border border-surface-container-highest', text: 'text-on-surface' }
}

export default function WorkoutExercise({ workoutId, exercise, targetSets, prescription, loggedSets }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const last = loggedSets[loggedSets.length - 1]

  const [weight, setWeight] = useState(
    last ? String(last.weightKg)
    : prescription?.targetWeightKg != null ? String(prescription.targetWeightKg)
    : '',
  )
  const [reps, setReps] = useState(
    last ? String(last.reps)
    : prescription ? String(prescription.targetReps)
    : '',
  )
  const [rir, setRir] = useState(
    last ? String(last.rir)
    : prescription ? String(prescription.targetRIR)
    : '2',
  )

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
  const ps = prescription ? prescriptionStyle(prescription) : null

  return (
    <div className={`bg-surface-container border rounded-xl p-md transition-colors ${done ? 'border-primary-container/40' : 'border-surface-container-highest'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-sm">
        <div className="flex-1 min-w-0">
          <h2 className="text-headline-md text-on-surface truncate">{exercise.name}</h2>
          <p className="text-label-caps text-secondary mt-0.5">
            {exercise.muscleGroup} · {exercise.repRangeLow}–{exercise.repRangeHigh} reps
          </p>
        </div>
        <span className={`ml-sm shrink-0 text-label-caps font-bold px-2 py-0.5 rounded-full ${
          done
            ? 'bg-primary-container/20 text-primary-container'
            : 'bg-surface-container-high text-secondary'
        }`}>
          {loggedSets.length}/{targetSets}
        </span>
      </div>

      {/* Prescription */}
      {prescription && ps && (
        <div className={`rounded-lg px-sm py-xs mb-sm ${ps.bg}`}>
          <div className={`flex items-baseline gap-1.5 text-body-sm font-semibold ${ps.text}`}>
            <span>{prescription.targetWeightKg != null ? `${prescription.targetWeightKg} kg` : '—'}</span>
            <span className="text-secondary font-normal">×</span>
            <span>{prescription.targetSets} sets</span>
            <span className="text-secondary font-normal">×</span>
            <span>{prescription.targetReps} reps</span>
            <span className="text-secondary font-normal text-[11px]">@ RIR {prescription.targetRIR}</span>
          </div>
          <p className="text-[11px] text-secondary mt-0.5 leading-snug">{prescription.note}</p>
        </div>
      )}

      {/* Logged sets table */}
      {loggedSets.length > 0 && (
        <div className="mb-sm rounded-lg overflow-hidden border border-surface-container-highest">
          <div className="grid grid-cols-[1.25rem_1fr_1fr_1fr_2rem] gap-x-2 px-sm py-xs text-label-caps text-secondary bg-surface-container-high">
            <span>#</span><span>KG</span><span>REPS</span><span>RIR</span><span />
          </div>
          {loggedSets.map((s, idx) => (
            <div
              key={s.id}
              className="grid grid-cols-[1.25rem_1fr_1fr_1fr_2rem] gap-x-2 items-center px-sm py-xs text-body-sm border-t border-surface-container-highest"
            >
              <span className="text-secondary">{idx + 1}</span>
              <span className="font-semibold text-on-surface">{s.weightKg}</span>
              <span className="font-semibold text-on-surface">{s.reps}</span>
              <span className="font-semibold text-on-surface">{s.rir}</span>
              <button
                onClick={() => handleDelete(s.id)}
                disabled={isPending}
                className="flex items-center justify-center text-secondary hover:text-error disabled:opacity-30 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add set row */}
      <div className="flex gap-sm">
        <input
          type="number"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          placeholder="kg"
          step="0.5"
          min="0"
          inputMode="decimal"
          className="flex-1 min-w-0 bg-surface-container-high border border-surface-container-highest rounded-lg px-2 py-3 text-body-sm text-center text-on-surface focus:outline-none focus:border-primary-container transition-colors placeholder:text-secondary"
        />
        <input
          type="number"
          value={reps}
          onChange={e => setReps(e.target.value)}
          placeholder="reps"
          min="1"
          max="99"
          inputMode="numeric"
          className="flex-1 min-w-0 bg-surface-container-high border border-surface-container-highest rounded-lg px-2 py-3 text-body-sm text-center text-on-surface focus:outline-none focus:border-primary-container transition-colors placeholder:text-secondary"
        />
        <input
          type="number"
          value={rir}
          onChange={e => setRir(e.target.value)}
          placeholder="RIR"
          min="0"
          max="9"
          inputMode="numeric"
          className="flex-1 min-w-0 bg-surface-container-high border border-surface-container-highest rounded-lg px-2 py-3 text-body-sm text-center text-on-surface focus:outline-none focus:border-primary-container transition-colors placeholder:text-secondary"
        />
        <button
          onClick={handleAdd}
          disabled={isPending || !weight || !reps || rir === ''}
          className="px-md py-3 bg-primary-container text-on-primary-container font-bold disabled:opacity-40 rounded-lg text-label-caps transition-all active:scale-95 shrink-0"
        >
          ADD
        </button>
      </div>
    </div>
  )
}
