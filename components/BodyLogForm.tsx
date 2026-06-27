'use client'

import { useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createBodyMetric } from '@/app/body/actions'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function BodyLogForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const weightKg = parseFloat(fd.get('weightKg') as string)
    const bfRaw = fd.get('bodyFatPct') as string
    const bodyFatPct = bfRaw ? parseFloat(bfRaw) : null

    startTransition(async () => {
      await createBodyMetric({ date: fd.get('date') as string, weightKg, bodyFatPct })
      formRef.current?.reset()
      // restore today's date after reset
      const dateInput = formRef.current?.querySelector<HTMLInputElement>('[name="date"]')
      if (dateInput) dateInput.value = todayStr()
      router.refresh()
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-4 mb-6 space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Log entry</h2>

      <input
        type="date"
        name="date"
        defaultValue={todayStr()}
        required
        className="w-full bg-gray-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      <div className="flex gap-3">
        <div className="flex-1">
          <input
            type="number"
            name="weightKg"
            step="0.1"
            min="20"
            max="300"
            placeholder="Weight (kg)"
            required
            inputMode="decimal"
            className="w-full bg-gray-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex-1">
          <input
            type="number"
            name="bodyFatPct"
            step="0.1"
            min="1"
            max="60"
            placeholder="Body fat % (opt.)"
            inputMode="decimal"
            className="w-full bg-gray-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg py-3 text-sm font-semibold transition-colors"
      >
        {isPending ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
