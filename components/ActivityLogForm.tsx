'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createActivity, type ActivityInput } from '@/app/workouts/actions'

type ActType = 'run' | 'walk' | 'cycle' | 'swim' | 'other'

const TYPES: { value: ActType; label: string; icon: string }[] = [
  { value: 'run',   label: 'Run',   icon: 'directions_run'  },
  { value: 'walk',  label: 'Walk',  icon: 'directions_walk' },
  { value: 'cycle', label: 'Cycle', icon: 'directions_bike' },
  { value: 'swim',  label: 'Swim',  icon: 'pool'            },
  { value: 'other', label: 'Other', icon: 'exercise'        },
]

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

function todayStr() {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

function fmtPace(durMin: number, distKm: number): string {
  if (distKm <= 0 || durMin <= 0) return '--'
  const raw = durMin / distKm
  const whole = Math.floor(raw)
  const secs = Math.round((raw - whole) * 60)
  return `${whole}:${String(secs).padStart(2, '0')}/km`
}

export default function ActivityLogForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [type, setType] = useState<ActType>('run')
  const [date, setDate] = useState(todayStr())
  const [dist, setDist] = useState('')
  const [dur, setDur]   = useState('')
  const [cal, setCal]   = useState('')
  const [note, setNote] = useState('')

  const showDist = type !== 'other'

  function num(s: string, int = false): number | null {
    if (!s) return null
    const v = int ? parseInt(s, 10) : parseFloat(s)
    return isNaN(v) ? null : v
  }

  function reset() {
    setType('run'); setDate(todayStr())
    setDist(''); setDur(''); setCal(''); setNote('')
  }

  function close() {
    setOpen(false)
    reset()
  }

  function handleSave() {
    const data: ActivityInput = {
      dateISO: `${date}T12:00:00`,
      type,
      distKm: showDist ? num(dist) : null,
      durMin: num(dur),
      calories: num(cal, true),
      note: note.trim() || null,
    }
    startTransition(async () => {
      await createActivity(data)
      close()
      router.refresh()
    })
  }

  const distN = num(dist)
  const durN = num(dur)
  const pace = showDist && distN && durN ? fmtPace(durN, distN) : null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-10 px-md bg-surface-container-high text-on-surface font-bold rounded-lg flex items-center gap-1 text-label-caps active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        ACTIVITY
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-end justify-center"
          onClick={close}
        >
          <div
            className="w-full max-w-md bg-surface-container-low border-t border-surface-container-highest rounded-t-2xl p-margin-mobile pb-8 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-md">
              <h2 className="text-headline-md text-on-surface">Log activity</h2>
              <button
                type="button"
                onClick={close}
                className="w-9 h-9 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container-high transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-lg">
              {/* Type */}
              <div className="grid grid-cols-5 gap-xs">
                {TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`flex flex-col items-center gap-1 p-xs rounded-lg border transition-colors min-w-0 ${
                      type === t.value
                        ? 'border-primary-container bg-surface-container-high text-primary-container'
                        : 'border-surface-container-highest bg-surface-container text-secondary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
                    <span className="text-[10px] font-semibold leading-tight truncate w-full text-center">{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Date */}
              <div>
                <label className="text-label-caps text-secondary block mb-xs">DATE</label>
                <input
                  type="date"
                  value={date}
                  max={todayStr()}
                  onChange={e => setDate(e.target.value)}
                  className="w-full h-10 bg-surface-container border border-surface-container-highest rounded-lg px-sm text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                />
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-sm">
                {showDist && (
                  <NumInput label="DISTANCE" unit="km" value={dist} onChange={setDist} step="0.01" />
                )}
                <NumInput label="TIME" unit="min" value={dur} onChange={setDur} step="0.5" />
                <NumInput label="CALORIES" unit="kcal" value={cal} onChange={setCal} />
              </div>

              {pace && (
                <p className="text-body-sm text-secondary -mt-sm">
                  Pace <span className="text-primary-container font-semibold">{pace}</span>
                </p>
              )}

              {/* Note */}
              <div>
                <label className="text-label-caps text-secondary block mb-xs">NOTE</label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. morning loop"
                  className="w-full h-10 bg-surface-container border border-surface-container-highest rounded-lg px-sm text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                />
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="w-full h-11 bg-primary-container text-on-primary-container font-bold rounded-lg flex items-center justify-center text-label-caps active:scale-95 transition-all disabled:opacity-50"
              >
                {isPending ? 'SAVING…' : 'SAVE ACTIVITY'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
