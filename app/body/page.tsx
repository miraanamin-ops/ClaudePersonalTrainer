import { prisma } from '@/lib/prisma'
import BodyLogForm from '@/components/BodyLogForm'
import BodyEntryList from '@/components/BodyEntryList'
import WeightChart from '@/components/WeightChart'

export const dynamic = 'force-dynamic'

export default async function BodyPage() {
  const raw = await prisma.bodyMetrics.findMany({ orderBy: { date: 'desc' } })

  const entries = raw.map(e => ({
    id: e.id,
    date: e.date.toISOString().slice(0, 10),
    weightKg: e.weightKg,
    bodyFatPct: e.bodyFatPct,
  }))

  // Chart wants oldest-first
  const chartData = [...entries].reverse()

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto pb-24">
      <h1 className="text-2xl font-bold mb-6">Body Tracking</h1>

      {entries.length >= 2 && <WeightChart data={chartData} />}

      <BodyLogForm />

      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">
        History
      </h2>
      <BodyEntryList entries={entries} />
    </main>
  )
}
