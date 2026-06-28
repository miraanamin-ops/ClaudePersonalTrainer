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

  const chartData = [...entries].reverse()
  const latest = entries[0]
  const prev = entries[1]
  const weekDelta = latest && prev
    ? (latest.weightKg - prev.weightKg).toFixed(1)
    : null

  return (
    <main className="min-h-screen pb-24 px-margin-mobile pt-6 max-w-md mx-auto">
      <h1 className="text-headline-lg-mobile text-on-surface mb-lg">Body Tracking</h1>

      {/* Hero stats */}
      {latest && (
        <div className="grid grid-cols-2 gap-md mb-xl">
          <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md flex flex-col justify-between aspect-square">
            <div>
              <span className="text-label-caps text-secondary block mb-xs">CURRENT WEIGHT</span>
              <div className="flex items-baseline gap-base">
                <span className="text-display-stat text-primary-container">{latest.weightKg}</span>
                <span className="text-label-caps text-secondary">KG</span>
              </div>
            </div>
            <div className="flex items-center gap-base text-primary-container">
              <span className="material-symbols-outlined text-[16px]">
                {weekDelta && parseFloat(weekDelta) < 0 ? 'trending_down' : 'trending_up'}
              </span>
              <span className="text-label-caps">
                {weekDelta ? `${weekDelta > '0' ? '+' : ''}${weekDelta} kg` : 'First entry'}
              </span>
            </div>
          </div>

          {latest.bodyFatPct !== null && (
            <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md flex flex-col justify-between aspect-square">
              <div>
                <span className="text-label-caps text-secondary block mb-xs">BODY FAT</span>
                <div className="flex items-baseline gap-base">
                  <span className="text-display-stat text-primary-container">{latest.bodyFatPct}</span>
                  <span className="text-label-caps text-secondary">%</span>
                </div>
              </div>
              <div className="flex items-center gap-base text-secondary">
                <span className="material-symbols-outlined text-[16px]">remove</span>
                <span className="text-label-caps">Tracking</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {chartData.length >= 2 && <WeightChart data={chartData} />}

      {/* Log form */}
      <BodyLogForm />

      {/* History */}
      <h2 className="text-headline-md text-on-surface mb-md">History</h2>
      <BodyEntryList entries={entries} />
    </main>
  )
}
