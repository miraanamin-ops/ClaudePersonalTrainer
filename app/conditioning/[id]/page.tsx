import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ConditioningLogger from '@/components/ConditioningLogger'
import { WOD_LIBRARY, type ConditioningResultType } from '@/lib/conditioning'

export const dynamic = 'force-dynamic'

function fmtDate(date: Date) {
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

type Props = { params: Promise<{ id: string }> }

export default async function ConditioningPage({ params }: Props) {
  const { id } = await params
  const sessionId = parseInt(id)
  if (isNaN(sessionId)) notFound()

  const session = await prisma.conditioningSession.findUnique({ where: { id: sessionId } })
  if (!session) notFound()

  const lines = session.prescription.split('\n')
  const coachingNote = WOD_LIBRARY.find(w => w.title === session.title)?.note ?? null

  return (
    <main className="min-h-screen pb-24 max-w-md mx-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-surface-container-highest">
        <div className="flex items-center justify-between px-margin-mobile h-16">
          <div className="flex-1 min-w-0">
            <h1 className="text-headline-md text-on-surface truncate">{session.title}</h1>
            <p className="text-[10px] text-secondary">{fmtDate(session.date)}</p>
          </div>
          <Link
            href="/workouts"
            className="h-10 px-md bg-primary-container text-on-primary-container font-bold rounded-lg flex items-center text-label-caps active:scale-95 transition-all ml-4 shrink-0"
          >
            DONE
          </Link>
        </div>
      </div>

      <div className="px-margin-mobile pt-md space-y-md">
        {/* The WOD */}
        <div className="bg-[#0a1c00] border border-primary-container/30 rounded-xl p-lg">
          <div className="flex items-center gap-2 mb-sm">
            <span className="material-symbols-outlined text-primary-container text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            <span className="text-label-caps text-primary-container">CONDITIONING · {session.format}</span>
          </div>
          <ul className="space-y-1.5">
            {lines.map((line, i) => (
              <li key={i} className="text-headline-md text-on-surface leading-snug">{line}</li>
            ))}
          </ul>
        </div>

        {/* Coaching note from the library */}
        {coachingNote && (
          <div className="flex gap-2 px-xs">
            <span className="material-symbols-outlined text-secondary text-[18px] shrink-0">tips_and_updates</span>
            <p className="text-body-sm text-secondary leading-relaxed">{coachingNote}</p>
          </div>
        )}
        <p className="text-[11px] text-secondary/70 leading-relaxed px-xs">
          Auto-programmed conditioning — logged separately from your lifting, so it won’t affect any weight prescriptions.
        </p>

        {/* Result logging */}
        <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md">
          <p className="text-label-caps text-secondary mb-md">LOG YOUR RESULT</p>
          <ConditioningLogger
            sessionId={session.id}
            resultType={session.resultType as ConditioningResultType}
            initialResultText={session.resultText}
            initialNote={session.note}
          />
        </div>
      </div>
    </main>
  )
}
