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
    <ul className="space-y-3">
      {templates.map(t => (
        <li key={t.id}>
          <button
            onClick={() => pick(t.id)}
            disabled={isPending}
            className="w-full text-left bg-gray-900 hover:bg-gray-800 disabled:opacity-50 rounded-xl px-5 py-5 transition-colors"
          >
            <span className="text-lg font-semibold">{t.name}</span>
          </button>
        </li>
      ))}
      {isPending && (
        <p className="text-center text-gray-500 text-sm pt-2">Starting workout…</p>
      )}
    </ul>
  )
}
