import { prisma } from '@/lib/prisma'
import TemplateSelector from '@/components/TemplateSelector'

export const dynamic = 'force-dynamic'

export default async function NewWorkoutPage() {
  const templates = await prisma.workoutTemplate.findMany({
    where: { isActive: true },
    orderBy: { id: 'asc' },
  })

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto pb-24">
      <h1 className="text-2xl font-bold mb-1">Start Workout</h1>
      <p className="text-gray-400 text-sm mb-6">Pick today&apos;s session</p>
      <TemplateSelector templates={templates} />
    </main>
  )
}
