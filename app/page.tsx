import { prisma } from '@/lib/prisma'

export default async function Home() {
  const [templates, exerciseCount, mealCount] = await Promise.all([
    prisma.workoutTemplate.findMany({ orderBy: { id: 'asc' } }),
    prisma.exercise.count(),
    prisma.meal.count(),
  ])

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-1">Personal Trainer</h1>
      <p className="text-green-400 text-sm mb-8">✓ Database connected</p>

      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Workout Templates
        </h2>
        <ul className="space-y-2">
          {templates.map(t => (
            <li key={t.id} className="bg-gray-800 rounded-lg px-4 py-3 text-sm">
              {t.name}
            </li>
          ))}
        </ul>
      </section>

      <div className="text-sm text-gray-500 space-y-1 border-t border-gray-800 pt-4">
        <p>{exerciseCount} exercises seeded</p>
        <p>{mealCount} meals / snacks / supplements in library</p>
      </div>
    </main>
  )
}
