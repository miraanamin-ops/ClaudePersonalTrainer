'use client'

import { useTransition } from 'react'
import { toggleCreatine } from '@/app/nutrition/actions'

type Props = {
  doseG: number
  taken: boolean
}

export default function CreatineCard({ doseG, taken }: Props) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md">
      <div className="flex items-center gap-2 mb-md">
        <span className="material-symbols-outlined text-primary-container">medication</span>
        <h3 className="text-headline-md text-on-surface">Supplements</h3>
        <span className="text-[10px] text-secondary bg-surface-container-high px-2 py-0.5 rounded-full ml-auto">resets daily</span>
      </div>

      <div className={`flex items-center gap-2 bg-surface-container-high p-sm rounded-lg transition-opacity ${isPending ? 'opacity-50' : ''} ${taken ? 'opacity-60' : ''}`}>
        <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">science</span>
        <div className="flex-1 min-w-0">
          <p className={`text-body-sm text-on-surface font-semibold ${taken ? 'line-through' : ''}`}>Creatine</p>
          <p className="text-[10px] text-secondary">{doseG}g daily</p>
        </div>
        <button
          onClick={() => startTransition(() => toggleCreatine(!taken))}
          disabled={isPending}
          title={taken ? 'Mark as not taken' : 'Mark as taken'}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container text-secondary hover:text-primary-container transition-colors disabled:opacity-30 shrink-0"
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={taken ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            check_circle
          </span>
        </button>
      </div>
    </div>
  )
}
