'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateBodyMetric, deleteBodyMetric } from '@/app/body/actions'

export type BodyEntry = {
  id: number
  date: string
  weightKg: number
  bodyFatPct: number | null
}

function fmtDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`
}

export default function BodyEntryList({ entries }: { entries: BodyEntry[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editWeight, setEditWeight] = useState('')
  const [editBf, setEditBf] = useState('')
  const [isPending, startTransition] = useTransition()

  function startEdit(e: BodyEntry) {
    setEditingId(e.id)
    setEditDate(e.date)
    setEditWeight(String(e.weightKg))
    setEditBf(e.bodyFatPct !== null ? String(e.bodyFatPct) : '')
  }

  function saveEdit() {
    if (editingId === null) return
    startTransition(async () => {
      await updateBodyMetric(editingId, {
        date: editDate,
        weightKg: parseFloat(editWeight),
        bodyFatPct: editBf ? parseFloat(editBf) : null,
      })
      setEditingId(null)
      router.refresh()
    })
  }

  function handleDelete(id: number) {
    if (!confirm('Delete this entry?')) return
    startTransition(async () => {
      await deleteBodyMetric(id)
      router.refresh()
    })
  }

  if (entries.length === 0) {
    return (
      <p className="text-center text-secondary text-body-sm py-10">
        No entries yet — log your first weight above.
      </p>
    )
  }

  return (
    <div className="space-y-sm">
      {entries.map(entry => (
        <div key={entry.id} className="bg-surface-container-low border border-surface-container-highest rounded-lg p-md">
          {editingId === entry.id ? (
            <div className="space-y-md">
              <input
                type="date"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
                className="w-full bg-surface-container-high border border-surface-container-highest rounded text-on-surface px-md py-2.5 text-body-sm focus:outline-none focus:border-primary-container transition-colors"
              />
              <div className="flex gap-md">
                <input
                  type="number"
                  value={editWeight}
                  onChange={e => setEditWeight(e.target.value)}
                  step="0.1"
                  placeholder="kg"
                  inputMode="decimal"
                  className="flex-1 bg-surface-container-high border border-surface-container-highest rounded text-on-surface px-md py-2.5 text-body-sm focus:outline-none focus:border-primary-container transition-colors"
                />
                <input
                  type="number"
                  value={editBf}
                  onChange={e => setEditBf(e.target.value)}
                  step="0.1"
                  placeholder="BF %"
                  inputMode="decimal"
                  className="flex-1 bg-surface-container-high border border-surface-container-highest rounded text-on-surface px-md py-2.5 text-body-sm focus:outline-none focus:border-primary-container transition-colors"
                />
              </div>
              <div className="flex gap-md">
                <button
                  onClick={saveEdit}
                  disabled={isPending}
                  className="flex-1 bg-primary-container text-on-primary-container font-bold rounded py-2.5 text-label-caps disabled:opacity-50 active:scale-95 transition-all"
                >
                  {isPending ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="flex-1 bg-surface-container-high text-secondary rounded py-2.5 text-label-caps hover:text-on-surface transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-lg text-on-surface">{fmtDate(entry.date)}</p>
                <p className="text-headline-md text-primary-container mt-0.5">{entry.weightKg} kg</p>
                {entry.bodyFatPct !== null && (
                  <p className="text-label-caps text-secondary">{entry.bodyFatPct}% BF</p>
                )}
              </div>
              <div className="flex gap-sm">
                <button
                  onClick={() => startEdit(entry)}
                  className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-secondary hover:text-primary-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={isPending}
                  className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-secondary hover:text-error transition-colors disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
