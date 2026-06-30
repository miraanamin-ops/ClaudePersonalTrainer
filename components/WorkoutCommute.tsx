'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveWorkoutTrip, deleteWorkoutTrip, type WorkoutTripInput } from '@/app/workouts/actions'

type Mode = 'run' | 'walk' | 'drive' | 'dropped_off'

const MODES: { value: Mode; label: string; icon: string }[] = [
  { value: 'run',         label: 'Run',      icon: 'directions_run'  },
  { value: 'walk',        label: 'Walk',     icon: 'directions_walk' },
  { value: 'drive',       label: 'Drive',    icon: 'drive_eta'       },
  { value: 'dropped_off', label: 'Drop-off', icon: 'person_pin'      },
]

export type ExistingTrip = {
  travelToMode: string
  travelToCalories: number | null
  travelToDistKm: number | null
  travelToDurMin: number | null
  travelFromMode: string
  travelFromCalories: number | null
  travelFromDistKm: number | null
  travelFromDurMin: number | null
  workoutCalories: number | null
}

function ModeSelector({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="grid grid-cols-4 gap-xs">
      {MODES.map(m => (
        <button
          key={m.value}
          type="button"
          onClick={() => onChange(m.value)}
          className={`flex flex-col items-center gap-1 p-xs rounded-lg border transition-colors min-w-0 ${
            value === m.value
              ? 'border-primary-container bg-surface-container-high text-primary-container'
              : 'border-surface-container-highest bg-surface-container text-secondary'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
          <span className="text-[10px] font-semibold leading-tight truncate w-full text-center">{m.label}</span>
        </button>
      ))}
    </div>
  )
}

function NumInput({
  label, unit, value, onChange, step = '1',
}: {
  label: string; unit: string; value: string; onChange: (v: string) => void; step?: string
}) {
  return (
    <div className="min-w-0">
      <label className="text-label-caps text-secondary block mb-xs">{label}</label>
      <div className="flex items-center gap-xs">
        <input
          type="number"
          min="0"
          step={step}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="0"
          className="flex-1 min-w-0 h-10 bg-surface-container border border-surface-container-highest rounded-lg px-sm text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
        />
        <span className="text-label-caps text-secondary w-8 shrink-0">{unit}</span>
      </div>
    </div>
  )
}

const numStr = (n: number | null | undefined) => (n == null ? '' : String(n))

export default function WorkoutCommute({ workoutId, trip }: { workoutId: number; trip: ExistingTrip | null }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(trip == null)

  const [toMode, setToMode]     = useState<Mode>((trip?.travelToMode as Mode) ?? 'run')
  const [toCal, setToCal]       = useState(numStr(trip?.travelToCalories))
  const [toDist, setToDist]     = useState(numStr(trip?.travelToDistKm))
  const [toDur, setToDur]       = useState(numStr(trip?.travelToDurMin))
  const [fromMode, setFromMode] = useState<Mode>((trip?.travelFromMode as Mode) ?? 'run')
  const [fromCal, setFromCal]   = useState(numStr(trip?.travelFromCalories))
  const [fromDist, setFromDist] = useState(numStr(trip?.travelFromDistKm))
  const [fromDur, setFromDur]   = useState(numStr(trip?.travelFromDurMin))
  const [gymCal, setGymCal]     = useState(numStr(trip?.workoutCalories))

  function num(s: string, int = false): number | null {
    if (!s) return null
    const v = int ? parseInt(s, 10) : parseFloat(s)
    return isNaN(v) ? null : v
  }

  function handleSave() {
    const data: WorkoutTripInput = {
      travelToMode: toMode,
      travelToCalories:   num(toCal, true),
      travelToDistKm:     toMode === 'run' ? num(toDist) : null,
      travelToDurMin:     toMode === 'run' ? num(toDur)  : null,
      travelFromMode: fromMode,
      travelFromCalories: num(fromCal, true),
      travelFromDistKm:   fromMode === 'run' ? num(fromDist) : null,
      travelFromDurMin:   fromMode === 'run' ? num(fromDur)  : null,
      workoutCalories:    num(gymCal, true),
    }
    startTransition(async () => {
      await saveWorkoutTrip(workoutId, data)
      setOpen(false)
      router.refresh()
    })
  }

  function handleClear() {
    startTransition(async () => {
      await deleteWorkoutTrip(workoutId)
      setToMode('run'); setToCal(''); setToDist(''); setToDur('')
      setFromMode('run'); setFromCal(''); setFromDist(''); setFromDur('')
      setGymCal('')
      setOpen(true)
      router.refresh()
    })
  }

  const totalCal =
    (num(toCal, true) ?? 0) + (num(fromCal, true) ?? 0) + (num(gymCal, true) ?? 0)

  return (
    <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full"
      >
        <span className="material-symbols-outlined text-primary-container shrink-0">directions_run</span>
        <h3 className="text-headline-md text-on-surface">Commute &amp; cardio</h3>
        {trip && !open && totalCal > 0 && (
          <span className="text-label-caps text-primary-container font-bold ml-auto shrink-0">{totalCal} kcal</span>
        )}
        <span className={`material-symbols-outlined text-secondary text-[18px] shrink-0 ${trip && !open ? '' : 'ml-auto'}`}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {!open && trip && (
        <p className="text-body-sm text-secondary mt-xs">Logged for this session — tap to edit.</p>
      )}
      {!open && !trip && (
        <p className="text-body-sm text-secondary mt-xs">Optional — log your commute and calories before you finish.</p>
      )}

      {open && (
        <div className="mt-md space-y-lg">
          {/* Travel TO */}
          <div>
            <h4 className="text-label-caps text-secondary mb-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-primary-container text-[16px]">north_east</span>
              TRAVEL TO GYM
            </h4>
            <ModeSelector value={toMode} onChange={m => { setToMode(m); if (m !== 'run') { setToDist(''); setToDur('') } }} />
            {(toMode === 'run' || toMode === 'walk') && (
              <div className="mt-sm space-y-sm">
                <NumInput label="CALORIES BURNED" unit="kcal" value={toCal} onChange={setToCal} />
                {toMode === 'run' && (
                  <div className="grid grid-cols-2 gap-sm">
                    <NumInput label="DISTANCE" unit="km" value={toDist} onChange={setToDist} step="0.01" />
                    <NumInput label="TIME" unit="min" value={toDur} onChange={setToDur} step="0.5" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Gym */}
          <div>
            <h4 className="text-label-caps text-secondary mb-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-primary-container text-[16px]">fitness_center</span>
              GYM WORKOUT
            </h4>
            <NumInput label="CALORIES BURNED" unit="kcal" value={gymCal} onChange={setGymCal} />
          </div>

          {/* Travel FROM */}
          <div>
            <h4 className="text-label-caps text-secondary mb-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-primary-container text-[16px]">south_west</span>
              TRAVEL FROM GYM
            </h4>
            <ModeSelector value={fromMode} onChange={m => { setFromMode(m); if (m !== 'run') { setFromDist(''); setFromDur('') } }} />
            {(fromMode === 'run' || fromMode === 'walk') && (
              <div className="mt-sm space-y-sm">
                <NumInput label="CALORIES BURNED" unit="kcal" value={fromCal} onChange={setFromCal} />
                {fromMode === 'run' && (
                  <div className="grid grid-cols-2 gap-sm">
                    <NumInput label="DISTANCE" unit="km" value={fromDist} onChange={setFromDist} step="0.01" />
                    <NumInput label="TIME" unit="min" value={fromDur} onChange={setFromDur} step="0.5" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-sm">
            {trip && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isPending}
                className="h-11 px-md rounded-lg text-body-sm text-secondary bg-surface-container-high disabled:opacity-50 shrink-0"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="flex-1 h-11 bg-primary-container text-on-primary-container font-bold rounded-lg flex items-center justify-center text-label-caps active:scale-95 transition-all disabled:opacity-50"
            >
              {isPending ? 'SAVING…' : trip ? 'UPDATE COMMUTE' : 'SAVE COMMUTE'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
