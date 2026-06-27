import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'

async function run() {
  const adapter = new PrismaLibSQL({
    url: process.env.DATABASE_URL ?? 'file:prisma/dev.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })
  const prisma = new PrismaClient({ adapter })
  try {
    const [templates, exerciseCount, mealCounts] = await Promise.all([
      prisma.workoutTemplate.findMany({ include: { templateExercises: true } }),
      prisma.exercise.count(),
      prisma.meal.groupBy({ by: ['type'], _count: { id: true } }),
    ])
    console.log('Templates:', templates.map(t => `${t.name} (${t.templateExercises.length} exercises)`))
    console.log('Total exercises:', exerciseCount)
    console.log('Meals by type:', mealCounts.map(m => `${m.type}: ${m._count.id}`))
  } finally {
    await prisma.$disconnect()
  }
}
run().catch(console.error)
