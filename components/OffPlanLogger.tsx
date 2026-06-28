'use client'

import { useState, useTransition } from 'react'
import { logOffPlanMeal, deleteOffPlanMeal } from '@/app/nutrition/actions'

type OffPlanMealEntry = {
  id: number
  description: string
  kcal: number
  proteinG: number
  fatG: number
  carbsG: number
}

type Props = {
  existing: OffPlanMealEntry[]
}

type Step = 'idle' | 'input' | 'estimating' | 'review'

export default function OffPlanLogger({ existing }: Props) {
  const [step, setStep] = useState<Step>('idle')
  const [description, setDescription] = useState('')
  const [estimateError, setEstimateError] = useState<string | null>(null)
  const [plausible, setPlausible] = useState(true)
  const [kcal, setKcal] = useState('')
  const [proteinG, setProteinG] = useState('')
  const [fatG, setFatG] = useState('')
  const [carbsG, setCarbsG] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDelete] = useTransition()

  function handleDelete(id: number) {
    startDelete(() => deleteOffPlanMeal(id))
  }

  async function handleEstimate() {
    setStep('estimating')
    setEstimateError(null)
    setPlausible(true)

    try {
      const res = await fetch('/api/estimate-macros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      const data: { kcal?: number; proteinG?: number; fatG?: number; carbsG?: number; plausible?: boolean; error?: string } = await res.json()

      if (!res.ok || data.error) {
        setEstimateError(data.error ?? "Couldn't estimate")
        setKcal(''); setProteinG(''); setFatG(''); setCarbsG('')
        setStep('review')
        return
      }

      setKcal(String(data.kcal ?? ''))
      setProteinG(String(data.proteinG ?? ''))
      setFatG(String(data.fatG ?? ''))
      setCarbsG(String(data.carbsG ?? ''))
      setPlausible(data.plausible ?? true)
      setStep('review')
    } catch {
      setEstimateError("Couldn't estimate — check your connection and try again")
      setKcal(''); setProteinG(''); setFatG(''); setCarbsG('')
      setStep('review')
    }
  }

  function handleSave() {
    const k = parseInt(kcal, 10)
    const p = parseFloat(proteinG)
    const f = parseFloat(fatG)
    const c = parseFloat(carbsG)
    if (isNaN(k) || isNaN(p) || isNaN(f) || isNaN(c)) return

    startTransition(async () => {
      await logOffPlanMeal(description, k, p, f, c)
      setStep('idle')
      setDescription('')
      setEstimateError(null)
      setPlausible(true)
    })
  }

  function handleCancel() {
    setStep('idle')
    setDescription('')
    setEstimateError(null)
    setPlausible(true)
  }

  const canSave = kcal !== '' && proteinG !== '' && fatG !== '' && carbsG !== '' && !isPending

  return (
    <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md">
      <div className="flex items-center gap-2 mb-md">
        <span className="material-symbols-outlined text-primary-container">no_meals</span>
        <h3 className="text-headline-md text-on-surface">Off-plan meals</h3>
      </div>

      {/* Already logged entries */}
      {existing.length > 0 && (
        <div className="space-y-sm mb-md">
          {existing.map(m => (
            <div key={m.id} className={`flex items-center justify-between bg-surface-container-high p-sm rounded-lg transition-opacity ${isDeleting ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm text-on-surface font-semibold truncate">{m.description}</p>
                <p className="text-[10px] text-secondary">P: {m.proteinG}g | C: {m.carbsG}g | F: {m.fatG}g</p>
              </div>
              <div className="flex items-center gap-sm ml-sm">
                <div className="text-right shrink-0">
                  <p className="text-headline-md text-primary-container">{m.kcal}</p>
                  <p className="text-[10px] text-secondary">KCAL</p>
                </div>
                <button
                  onClick={() => handleDelete(m.id)}
                  disabled={isDeleting}
                  title="Delete entry"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:text-error transition-colors disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new entry */}
      {step === 'idle' && (
        <button
          onClick={() => setStep('input')}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-surface-container-highest py-sm text-secondary text-body-sm hover:text-primary-container hover:border-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Log off-plan meal
        </button>
      )}

      {step === 'input' && (
        <div className="space-y-sm">
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. almond croissant and a latte"
            autoFocus
            className="w-full bg-surface-container-high border border-surface-container-highest rounded-lg p-sm text-body-sm text-on-surface placeholder:text-secondary resize-none h-20 focus:outline-none focus:border-primary-container"
          />
          <div className="flex gap-sm">
            <button
              onClick={handleCancel}
              className="flex-1 py-sm rounded-lg text-body-sm text-secondary bg-surface-container-high"
            >
              Cancel
            </button>
            <button
              onClick={handleEstimate}
              disabled={!description.trim()}
              className="flex-1 py-sm rounded-lg text-body-sm text-on-primary-container bg-primary-container disabled:opacity-40"
            >
              Estimate
            </button>
          </div>
        </div>
      )}

      {step === 'estimating' && (
        <div className="flex items-center justify-center gap-2 py-md text-secondary text-body-sm">
          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
          Estimating…
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-sm">
          <p className="text-body-sm text-secondary italic truncate">&ldquo;{description}&rdquo;</p>

          {estimateError && (
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg px-sm py-xs">
              <p className="text-body-sm text-amber-400">{estimateError} — enter the numbers yourself below.</p>
            </div>
          )}

          {!estimateError && !plausible && (
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg px-sm py-xs">
              <p className="text-body-sm text-amber-400">
                Macros don&apos;t add up to the estimated kcal (protein×4 + carbs×4 + fat×9 looks off). Please check and correct before saving.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-sm">
            {[
              { label: 'Kcal', value: kcal, set: setKcal, step: '1' },
              { label: 'Protein g', value: proteinG, set: setProteinG, step: '0.1' },
              { label: 'Fat g', value: fatG, set: setFatG, step: '0.1' },
              { label: 'Carbs g', value: carbsG, set: setCarbsG, step: '0.1' },
            ].map(({ label, value, set, step: s }) => (
              <label key={label} className="flex flex-col gap-1">
                <span className="text-[10px] text-secondary">{label.toUpperCase()}</span>
                <input
                  type="number"
                  value={value}
                  onChange={e => set(e.target.value)}
                  min={0}
                  step={s}
                  className="bg-surface-container-high border border-surface-container-highest rounded-lg px-sm py-xs text-body-sm text-on-surface focus:outline-none focus:border-primary-container w-full"
                />
              </label>
            ))}
          </div>

          <div className="flex gap-sm">
            <button
              onClick={handleCancel}
              className="flex-1 py-sm rounded-lg text-body-sm text-secondary bg-surface-container-high"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="flex-1 py-sm rounded-lg text-body-sm text-on-primary-container bg-primary-container disabled:opacity-40"
            >
              {isPending ? 'Saving…' : 'Save & re-fit'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
