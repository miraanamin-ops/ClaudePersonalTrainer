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

export default function WorkoutExercise({ workoutId, exercise, targetSets, prescription, loggedSets }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const last = loggedSets[loggedSets.length - 1]
  const isFirstTime = prescription?.action === 'first'

  const [weight, setWeight] = useState(
    last                                    ? String(last.weightKg)
    : prescription?.targetWeightKg != null ? String(prescription.targetWeightKg)
    : '',
  )
  const [reps, setReps] = useState(
    last         ? String(last.reps)
    : prescription ? String(prescription.targetReps)
    : '',
  )
  const [rir, setRir] = useState(
    last         ? String(last.rir)
    : prescription ? String(prescription.targetRIR)
    : '2',
  )

  // First-time starting weight state
  const [startingWeight, setStartingWeight] = useState('')
  const [weightConfirmed, setWeightConfirmed] = useState(loggedSets.length > 0)

  const showFirstTimePrompt = isFirstTime && loggedSets.length === 0 && !weightConfirmed

  function confirmStartingWeight() {
    if (!startingWeight) return
    setWeight(startingWeight)
    setReps(String(prescription?.targetReps ?? exercise.repRangeLow))
    setRir(String(prescription?.targetRIR ?? 2))
    setWeightConfirmed(true)
  }

  function handleAdd() {
    if (!weight || !reps || rir === '') return
    startTransition(async () => {
      await addSet(workoutId, exercise.id, loggedSets.length + 1, parseFloat(weight), parseInt(reps), parseInt(rir))
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

  // Prescription card style
  const prescriptionAccent = !prescription ? null
    : prescription.isDeload || prescription.earlyDeloadWarning ? {
        bg: 'bg-[#1c1100] border-tertiary-container/30',
        label: prescription.isDeload ? 'DELOAD' : 'FATIGUED',
        labelColor: 'text-tertiary-container',
        valueColor: 'text-tertiary-container',
      }
    : prescription.action === 'increase' ? {
        bg: 'bg-[#0a1c00] border-primary-container/30',
        label: "TODAY'S TARGET",
        labelColor: 'text-primary-container',
        valueColor: 'text-primary-container',
      }
    : {
        bg: 'bg-surface-container-high border-surface-container-highest',
        label: isFirstTime ? 'FIRST SESSION' : "TODAY'S TARGET",
        labelColor: 'text-secondary',
        valueColor: 'text-on-surface',
      }

  return (
    <div className={`bg-surface-container border rounded-xl overflow-hidden transition-colors ${
      done ? 'border-primary-container/40' : 'border-surface-container-highest'
    }`}>

      {/* Header */}
      <div className="flex items-start justify-between p-md pb-sm">
        <div className="flex-1 min-w-0">
          <h2 className="text-headline-md text-on-surface">{exercise.name}</h2>
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

      {/* First-time prompt — replaces normal prescription card */}
      {showFirstTimePrompt && prescription && (
        <div className="mx-md mb-md bg-[#1c1100] border border-tertiary-container/30 rounded-xl p-md">
          <div className="flex items-center gap-2 mb-sm">
            <span className="material-symbols-outlined text-tertiary-container text-[18px]">new_releases</span>
            <span className="text-label-caps text-tertiary-container">FIRST SESSION</span>
          </div>
          <p className="text-body-sm text-secondary leading-relaxed mb-md">
            Enter a weight you can lift for {exercise.repRangeLow}–{exercise.repRangeHigh} reps while
            keeping about {prescription.targetRIR} reps still in the tank. We'll track progress from here.
          </p>
          <div className="flex items-center gap-sm bg-surface-container/60 rounded-lg px-sm py-xs mb-md">
            <span className="material-symbols-outlined text-secondary text-[16px]">layers</span>
            <span className="text-label-caps text-secondary">
              {targetSets} sets · {exercise.repRangeLow}–{exercise.repRangeHigh} reps · RIR {prescription.targetRIR}
            </span>
          </div>
          <div className="flex gap-sm">
            <input
              type="number"
              value={startingWeight}
              onChange={e => setStartingWeight(e.target.value)}
              placeholder="Starting kg"
              step="0.5"
              min="0"
              inputMode="decimal"
              className="flex-1 bg-surface-container border border-tertiary-container/40 rounded-lg px-md py-3 text-body-lg text-on-surface text-center focus:outline-none focus:border-tertiary-container transition-colors placeholder:text-secondary"
            />
            <button
              onClick={confirmStartingWeight}
              disabled={!startingWeight}
              className="px-lg bg-tertiary-container text-on-tertiary font-bold rounded-lg text-label-caps disabled:opacity-40 active:scale-95 transition-all shrink-0"
            >
              START
            </button>
          </div>
        </div>
      )}

      {/* Normal prescription card */}
      {prescription && !showFirstTimePrompt && prescriptionAccent && (
        <div className={`mx-md mb-sm rounded-xl p-md border ${prescriptionAccent.bg}`}>
          <p className={`text-label-caps mb-xs ${prescriptionAccent.labelColor}`}>
            {prescriptionAccent.label}
          </p>
          <div className="flex items-baseline gap-sm flex-wrap">
            <span className={`text-headline-lg-mobile font-bold ${prescriptionAccent.valueColor}`}>
              {prescription.targetWeightKg != null
                ? `${prescription.targetWeightKg} kg`
                : weight ? `${weight} kg` : '—'}
            </span>
            <span className="text-secondary">×</span>
            <span className="text-headline-md text-on-surface">{targetSets} sets</span>
            <span className="text-secondary">×</span>
            <span className="text-headline-md text-on-surface">
              {exercise.repRangeLow}–{exercise.repRangeHigh} reps
            </span>
            <span className="text-label-caps text-secondary">@ RIR {prescription.targetRIR}</span>
          </div>
          <p className="text-body-sm text-secondary mt-xs leading-snug">{prescription.note}</p>
        </div>
      )}

      {/* Logged sets */}
      {loggedSets.length > 0 && (
        <div className="mx-md mb-sm rounded-lg overflow-hidden border border-surface-container-highest">
          <div className="grid grid-cols-[1.5rem_1fr_1fr_1fr_2rem] gap-x-2 px-sm py-xs text-label-caps text-secondary bg-surface-container-high">
            <span>#</span><span>KG</span><span>REPS</span><span>RIR</span><span />
          </div>
          {loggedSets.map((s, idx) => (
            <div
              key={s.id}
              className="grid grid-cols-[1.5rem_1fr_1fr_1fr_2rem] gap-x-2 items-center px-sm py-xs text-body-sm border-t border-surface-container-highest"
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

      {/* Add set row — hidden until starting weight is confirmed for first-time */}
      {!showFirstTimePrompt && (
        <div className="flex gap-sm p-md pt-xs">
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
      )}
    </div>
  )
}
