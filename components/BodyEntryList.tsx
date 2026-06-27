'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateBodyMetric, deleteBodyMetric } from '@/app/body/actions'

export type BodyEntry = {
  id: number
  date: string      // "YYYY-MM-DD"
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
      <p className="text-center text-gray-500 text-sm py-10">
        No entries yet — log your first weight above.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {entries.map(entry => (
        <li key={entry.id} className="bg-gray-900 rounded-xl p-4">
          {editingId === entry.id ? (
            <div className="space-y-3">
              <input
                type="date"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
                className="w-full bg-gray-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={editWeight}
                  onChange={e => setEditWeight(e.target.value)}
                  step="0.1"
                  placeholder="kg"
                  inputMode="decimal"
                  className="flex-1 bg-gray-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="number"
                  value={editBf}
                  onChange={e => setEditBf(e.target.value)}
                  step="0.1"
                  placeholder="BF %"
                  inputMode="decimal"
                  className="flex-1 bg-gray-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={isPending}
                  className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg py-2.5 text-sm font-semibold transition-colors"
                >
                  {isPending ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 rounded-lg py-2.5 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">{fmtDate(entry.date)}</p>
                <p className="text-xl font-semibold leading-tight">{entry.weightKg} kg</p>
                {entry.bodyFatPct !== null && (
                  <p className="text-sm text-orange-400 mt-0.5">{entry.bodyFatPct}% body fat</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => startEdit(entry)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={isPending}
                  className="px-4 py-2 bg-red-950 hover:bg-red-900 disabled:opacity-50 rounded-lg text-sm text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
