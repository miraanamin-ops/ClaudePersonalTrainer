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
      const dateInput = formRef.current?.querySelector<HTMLInputElement>('[name="date"]')
      if (dateInput) dateInput.value = todayStr()
      router.refresh()
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="bg-surface-container border border-surface-container-highest rounded-xl p-md space-y-md mb-xl">
      <h2 className="text-label-caps text-secondary uppercase">New Measurement</h2>

      <input
        type="date"
        name="date"
        defaultValue={todayStr()}
        required
        className="w-full bg-surface-container-high border border-surface-container-highest rounded-lg px-md py-3 text-body-sm text-on-surface focus:outline-none focus:border-primary-container transition-colors"
      />

      <div className="grid grid-cols-2 gap-md">
        <div className="space-y-xs">
          <label className="text-label-caps text-secondary">WEIGHT (KG)</label>
          <input
            type="number"
            name="weightKg"
            step="0.1"
            min="20"
            max="300"
            placeholder="00.0"
            required
            inputMode="decimal"
            className="w-full bg-surface-container-high border border-surface-container-highest rounded-lg px-md py-3 text-body-sm text-on-surface focus:outline-none focus:border-primary-container transition-colors"
          />
        </div>
        <div className="space-y-xs">
          <label className="text-label-caps text-secondary">BODY FAT (%)</label>
          <input
            type="number"
            name="bodyFatPct"
            step="0.1"
            min="1"
            max="60"
            placeholder="00.0"
            inputMode="decimal"
            className="w-full bg-surface-container-high border border-surface-container-highest rounded-lg px-md py-3 text-body-sm text-on-surface focus:outline-none focus:border-primary-container transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary-container text-on-primary-container font-bold py-md rounded-lg flex justify-center items-center gap-sm active:scale-95 transition-all disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
        <span className="text-label-caps">{isPending ? 'SAVING…' : 'LOG MEASUREMENT'}</span>
      </button>
    </form>
  )
}
