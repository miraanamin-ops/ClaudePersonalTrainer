'use server'

import { prisma } from '@/lib/prisma'
import { selectMeals, dateRange } from '@/lib/nutrition'
import { revalidatePath } from 'next/cache'

async function yesterdaysDinnerId(): Promise<number | null> {
  const y = new Date(); y.setDate(y.getDate() - 1)
  const { start, end } = dateRange(y)
  const plan = await prisma.mealPlan.findFirst({ where: { date: { gte: start, lte: end } } })
  return plan?.dinnerMealId ?? null
}

async function savePlan(
  breakfastMealId: number,
  dinnerMealId: number,
  snackIds: number[],
  breakfastLocked: boolean,
  dinnerLocked: boolean,
) {
  const { start, end } = dateRange(new Date())
  const existing = await prisma.mealPlan.findFirst({ where: { date: { gte: start, lte: end } } })

  let planId: number
  if (existing) {
    await prisma.mealPlan.update({
      where: { id: existing.id },
      data: { breakfastMealId, dinnerMealId, breakfastLocked, dinnerLocked },
    })
    planId = existing.id
  } else {
    const created = await prisma.mealPlan.create({
      data: { date: new Date(), breakfastMealId, dinnerMealId, breakfastLocked, dinnerLocked },
    })
    planId = created.id
  }

  await prisma.mealPlanSnack.deleteMany({ where: { mealPlanId: planId } })
  if (snackIds.length > 0) {
    await prisma.mealPlanSnack.createMany({
      data: snackIds.map(mealId => ({ mealPlanId: planId, mealId })),
    })
  }
  revalidatePath('/nutrition')
}

export async function generatePlan() {
  const { start, end } = dateRange(new Date())
  const existing = await prisma.mealPlan.findFirst({ where: { date: { gte: start, lte: end } } })
  const yDinnerId = await yesterdaysDinnerId()

  const { breakfastId, dinnerId, snackIds } = await selectMeals({
    fixedBreakfastId: existing?.breakfastLocked ? existing.breakfastMealId : null,
    fixedDinnerId:    existing?.dinnerLocked    ? existing.dinnerMealId    : null,
    yesterdaysDinnerId: yDinnerId,
  })

  await savePlan(
    breakfastId, dinnerId, snackIds,
    !!existing?.breakfastLocked,
    !!existing?.dinnerLocked,
  )
}

export async function lockMeal(slot: 'breakfast' | 'dinner', locked: boolean) {
  const { start, end } = dateRange(new Date())
  const existing = await prisma.mealPlan.findFirst({ where: { date: { gte: start, lte: end } } })
  if (!existing) return
  await prisma.mealPlan.update({
    where: { id: existing.id },
    data: slot === 'breakfast' ? { breakfastLocked: locked } : { dinnerLocked: locked },
  })
  revalidatePath('/nutrition')
}

export async function swapMeal(slot: 'breakfast' | 'dinner') {
  const { start, end } = dateRange(new Date())
  const existing = await prisma.mealPlan.findFirst({ where: { date: { gte: start, lte: end } } })
  if (!existing) return

  const yDinnerId = await yesterdaysDinnerId()

  const { breakfastId, dinnerId, snackIds } = await selectMeals(
    slot === 'breakfast'
      ? {
          fixedDinnerId:        existing.dinnerMealId,
          excludeBreakfastIds:  new Set([existing.breakfastMealId]),
          yesterdaysDinnerId:   yDinnerId,
        }
      : {
          fixedBreakfastId:   existing.breakfastMealId,
          excludeDinnerIds:   new Set([existing.dinnerMealId]),
          yesterdaysDinnerId: yDinnerId,
        },
  )

  await savePlan(
    breakfastId, dinnerId, snackIds,
    existing.breakfastLocked,
    existing.dinnerLocked,
  )
}

export async function saveTargets(kcal: number, proteinG: number, fatG: number, carbsG: number) {
  const existing = await prisma.nutritionTarget.findFirst()
  if (existing) {
    await prisma.nutritionTarget.update({ where: { id: existing.id }, data: { kcal, proteinG, fatG, carbsG } })
  } else {
    await prisma.nutritionTarget.create({ data: { kcal, proteinG, fatG, carbsG } })
  }
  // Re-run selection so snacks/macros reflect new targets (respects existing locks)
  await generatePlan()
}
