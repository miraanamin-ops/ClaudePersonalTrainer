'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkout } from '@/app/workouts/actions'

type Template = { id: number; name: string }

export default function TemplateSelector({ templates }: { templates: Template[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function pick(templateId: number) {
    startTransition(async () => {
      const id = await createWorkout(templateId)
      router.push(`/workouts/${id}`)
    })
  }

  return (
    <ul className="space-y-sm">
      {templates.map(t => (
        <li key={t.id}>
          <button
            onClick={() => pick(t.id)}
            disabled={isPending}
            className="w-full text-left bg-surface-container border border-surface-container-highest rounded-xl px-md py-md active:bg-surface-container-high disabled:opacity-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">fitness_center</span>
                </div>
                <span className="text-headline-md text-on-surface">{t.name}</span>
              </div>
              <span className="material-symbols-outlined text-secondary">chevron_right</span>
            </div>
          </button>
        </li>
      ))}
      {isPending && (
        <div className="flex items-center justify-center gap-2 py-md text-secondary">
          <span className="material-symbols-outlined animate-spin text-primary-container">refresh</span>
          <span className="text-body-sm">Starting workout…</span>
        </div>
      )}
    </ul>
  )
}
