'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { logTrip } from '@/app/activity/actions'

type Mode = 'run' | 'walk' | 'drive' | 'dropped_off'

const MODES: { value: Mode; label: string; icon: string }[] = [
  { value: 'run',         label: 'Run',      icon: 'directions_run'  },
  { value: 'walk',        label: 'Walk',     icon: 'directions_walk' },
  { value: 'drive',       label: 'Drive',    icon: 'drive_eta'       },
  { value: 'dropped_off', label: 'Drop-off', icon: 'person_pin'      },
]

function localDatetimeNow(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

function ModeSelector({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="grid grid-cols-4 gap-xs">
      {MODES.map(m => (
        <button
          key={m.value}
          type="button"
          onClick={() => onChange(m.value)}
          className={`flex flex-col items-center gap-1 p-xs rounded-lg border transition-colors ${
            value === m.value
              ? 'border-primary-container bg-surface-container-high text-primary-container'
              : 'border-surface-container-highest bg-surface-container text-secondary'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
          <span className="text-[10px] font-semibold leading-tight">{m.label}</span>
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
    <div>
      <label className="text-label-caps text-secondary block mb-xs">{label}</label>
      <div className="flex items-center gap-xs">
        <input
          type="number"
          min="0"
          step={step}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="0"
          className="flex-1 h-10 bg-surface-container border border-surface-container-highest rounded-lg px-sm text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
        />
        <span className="text-label-caps text-secondary w-8 shrink-0">{unit}</span>
      </div>
    </div>
  )
}

export default function GymTripForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [dateStr, setDateStr] = useState(localDatetimeNow)
  const [toMode, setToMode] = useState<Mode>('run')
  const [toCal, setToCal] = useState('')
  const [toDist, setToDist] = useState('')
  const [toDur, setToDur] = useState('')
  const [fromMode, setFromMode] = useState<Mode>('run')
  const [fromCal, setFromCal] = useState('')
  const [fromDist, setFromDist] = useState('')
  const [fromDur, setFromDur] = useState('')
  const [gymCal, setGymCal] = useState('')

  function num(s: string, int: true): number | null
  function num(s: string, int?: false): number | null
  function num(s: string, int?: boolean): number | null {
    if (!s) return null
    const v = int ? parseInt(s, 10) : parseFloat(s)
    return isNaN(v) ? null : v
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await logTrip({
        dateStr,
        travelToMode: toMode,
        travelToCalories:   num(toCal, true),
        travelToDistKm:     toMode === 'run' ? num(toDist) : null,
        travelToDurMin:     toMode === 'run' ? num(toDur)  : null,
        travelFromMode: fromMode,
        travelFromCalories: num(fromCal, true),
        travelFromDistKm:   fromMode === 'run' ? num(fromDist) : null,
        travelFromDurMin:   fromMode === 'run' ? num(fromDur)  : null,
        workoutCalories:    num(gymCal, true),
      })
      router.push('/activity')
    })
  }

  const toHasStats  = toMode === 'run' || toMode === 'walk'
  const fromHasStats = fromMode === 'run' || fromMode === 'walk'

  return (
    <form onSubmit={handleSubmit} className="space-y-lg">
      {/* Date */}
      <div>
        <label className="text-label-caps text-secondary block mb-xs">DATE &amp; TIME</label>
        <input
          type="datetime-local"
          value={dateStr}
          onChange={e => setDateStr(e.target.value)}
          className="w-full h-10 bg-surface-container border border-surface-container-highest rounded-lg px-sm text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
        />
      </div>

      {/* Travel TO */}
      <div>
        <h3 className="text-headline-md text-on-surface mb-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-[20px]">north_east</span>
          Travel to gym
        </h3>
        <ModeSelector value={toMode} onChange={m => { setToMode(m); setToCal(''); setToDist(''); setToDur('') }} />
        {toHasStats && (
          <div className="mt-sm space-y-sm">
            <NumInput label="CALORIES BURNED" unit="kcal" value={toCal} onChange={setToCal} />
            {toMode === 'run' && (
              <>
                <NumInput label="DISTANCE" unit="km" value={toDist} onChange={setToDist} step="0.01" />
                <NumInput label="TIME" unit="min" value={toDur} onChange={setToDur} step="0.5" />
              </>
            )}
          </div>
        )}
      </div>

      {/* Workout */}
      <div>
        <h3 className="text-headline-md text-on-surface mb-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-[20px]">fitness_center</span>
          Gym workout
        </h3>
        <NumInput label="CALORIES BURNED" unit="kcal" value={gymCal} onChange={setGymCal} />
      </div>

      {/* Travel FROM */}
      <div>
        <h3 className="text-headline-md text-on-surface mb-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-[20px]">south_west</span>
          Travel from gym
        </h3>
        <ModeSelector value={fromMode} onChange={m => { setFromMode(m); setFromCal(''); setFromDist(''); setFromDur('') }} />
        {fromHasStats && (
          <div className="mt-sm space-y-sm">
            <NumInput label="CALORIES BURNED" unit="kcal" value={fromCal} onChange={setFromCal} />
            {fromMode === 'run' && (
              <>
                <NumInput label="DISTANCE" unit="km" value={fromDist} onChange={setFromDist} step="0.01" />
                <NumInput label="TIME" unit="min" value={fromDur} onChange={setFromDur} step="0.5" />
              </>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-12 bg-primary-container text-on-primary-container font-bold rounded-xl flex items-center justify-center gap-2 text-label-caps active:scale-95 transition-all disabled:opacity-50"
      >
        {isPending ? 'Saving…' : 'SAVE TRIP'}
      </button>
    </form>
  )
}
