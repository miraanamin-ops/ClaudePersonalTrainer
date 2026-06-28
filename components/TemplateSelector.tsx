'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkout } from '@/app/workouts/actions'

type Template = { id: number; name: string }

type Props = {
  templates: Template[]
  recommendedId: number | null
}

export default function TemplateSelector({ templates, recommendedId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function pick(templateId: number) {
    startTransition(async () => {
      const id = await createWorkout(templateId)
      router.push(`/workouts/${id}`)
    })
  }

  const recommended = templates.find(t => t.id === recommendedId) ?? null
  const others = templates.filter(t => t.id !== recommendedId)

  return (
    <div className={`space-y-lg ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* Recommended session — the trainer's call */}
      {recommended && (
        <div>
          <p className="text-label-caps text-secondary mb-sm">TODAY'S SESSION</p>
          <button
            onClick={() => pick(recommended.id)}
            disabled={isPending}
            className="w-full bg-primary-container/10 border border-primary-container/40 rounded-xl p-lg flex items-center justify-between gap-md active:scale-[0.98] transition-all"
          >
            <div className="text-left">
              <p className="text-headline-lg-mobile text-primary-container">{recommended.name}</p>
              <p className="text-body-sm text-secondary mt-xs">Up next in your rotation</p>
            </div>
            <span
              className="material-symbols-outlined text-primary-container shrink-0"
              style={{ fontSize: 48, fontVariationSettings: "'FILL' 1" }}
            >
              play_circle
            </span>
          </button>
        </div>
      )}

      {/* Other templates */}
      {others.length > 0 && (
        <div>
          <p className="text-label-caps text-secondary mb-sm">
            {recommended ? 'OR CHOOSE DIFFERENTLY' : 'SELECT WORKOUT'}
          </p>
          <ul className="space-y-sm">
            {others.map(t => (
              <li key={t.id}>
                <button
                  onClick={() => pick(t.id)}
                  disabled={isPending}
                  className="w-full text-left bg-surface-container border border-surface-container-highest rounded-xl px-md py-md active:bg-surface-container-high transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-secondary text-[18px]">fitness_center</span>
                      </div>
                      <span className="text-body-lg text-secondary font-semibold">{t.name}</span>
                    </div>
                    <span className="material-symbols-outlined text-secondary text-[18px]">chevron_right</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isPending && (
        <div className="flex items-center justify-center gap-2 py-md text-secondary">
          <span className="material-symbols-outlined animate-spin text-primary-container">refresh</span>
          <span className="text-body-sm">Starting workout…</span>
        </div>
      )}
    </div>
  )
}
