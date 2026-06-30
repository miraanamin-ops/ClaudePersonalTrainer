'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveConditioningResult, deleteConditioningSession } from '@/app/conditioning/actions'
import type { ConditioningResultType } from '@/lib/conditioning'

type Props = {
  sessionId: number
  resultType: ConditioningResultType
  initialResultText: string | null
  initialNote: string | null
}

const RESULT_LABEL: Record<ConditioningResultType, string> = {
  time: 'Finish time',
  rounds: 'Rounds + reps',
  none: '',
}

const RESULT_PLACEHOLDER: Record<ConditioningResultType, string> = {
  time: 'e.g. 14:32',
  rounds: 'e.g. 5 rounds + 8',
  none: '',
}

export default function ConditioningLogger({
  sessionId,
  resultType,
  initialResultText,
  initialNote,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState(initialResultText ?? '')
  const [note, setNote] = useState(initialNote ?? '')
  const [saved, setSaved] = useState(false)

  const logged = (initialResultText ?? '') !== '' || (initialNote ?? '') !== ''

  function handleSave() {
    startTransition(async () => {
      await saveConditioningResult(
        sessionId,
        result.trim() || null,
        note.trim() || null,
      )
      setSaved(true)
      router.refresh()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteConditioningSession(sessionId)
    })
  }

  return (
    <div className="space-y-md">
      {resultType !== 'none' && (
        <div>
          <label className="text-label-caps text-secondary block mb-xs">{RESULT_LABEL[resultType]}</label>
          <input
            type="text"
            value={result}
            onChange={e => setResult(e.target.value)}
            placeholder={RESULT_PLACEHOLDER[resultType]}
            className="w-full bg-surface-container-high border border-surface-container-highest rounded-lg px-md py-3 text-body-lg text-on-surface text-center focus:outline-none focus:border-primary-container transition-colors placeholder:text-secondary"
          />
        </div>
      )}

      <div>
        <label className="text-label-caps text-secondary block mb-xs">How did it feel? (optional)</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
          placeholder="Scaling, RPE, what to change next time…"
          className="w-full bg-surface-container-high border border-surface-container-highest rounded-lg px-md py-3 text-body-sm text-on-surface focus:outline-none focus:border-primary-container transition-colors placeholder:text-secondary resize-none"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full h-14 bg-primary-container text-on-primary-container font-bold rounded-xl flex items-center justify-center gap-2 text-label-caps disabled:opacity-40 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          {saved || logged ? 'check_circle' : 'save'}
        </span>
        {saved ? 'SAVED' : logged ? 'UPDATE RESULT' : 'SAVE RESULT'}
      </button>

      <button
        onClick={handleDelete}
        disabled={isPending}
        className="w-full py-2 text-secondary hover:text-error text-label-caps disabled:opacity-40 transition-colors"
      >
        Discard session
      </button>
    </div>
  )
}
