import { prisma } from '@/lib/prisma'
import NewBlockForm from '@/components/NewBlockForm'

export const dynamic = 'force-dynamic'

export default async function NewBlockPage() {
  const blockNumber = (await prisma.mesocycle.count()) + 1

  return (
    <main className="min-h-screen pb-24 px-margin-mobile pt-6 max-w-md mx-auto">
      <h1 className="text-headline-lg-mobile text-on-surface mb-xs">New Training Block</h1>
      <p className="text-label-caps text-secondary mb-xl">
        BLOCK {blockNumber}{blockNumber <= 2 ? ' — BEGINNER PHASE' : ' — FULL PERIODISATION'}
      </p>
      <NewBlockForm blockNumber={blockNumber} />
    </main>
  )
}
