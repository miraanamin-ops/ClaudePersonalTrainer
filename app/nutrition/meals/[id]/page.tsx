import { prisma } from '@/lib/prisma'
import { getTargets, dateRange } from '@/lib/nutrition'
import ServingAdjuster from '@/components/ServingAdjuster'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const TYPE_LABEL: Record<string, string> = {
  breakfast: 'Breakfast',
  dinner:    'Dinner',
  snack:     'Snack',
}

const STEPS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3]

function snapScale(raw: number): number {
  return STEPS.reduce((prev, curr) =>
    Math.abs(curr - raw) < Math.abs(prev - raw) ? curr : prev,
  )
}

export default async function MealRecipePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ scale?: string }>
}) {
  const { id: idStr } = await params
  const { scale: scaleStr } = await searchParams
  const id = parseInt(idStr, 10)
  if (isNaN(id)) notFound()

  const [meal, targets] = await Promise.all([
    prisma.meal.findUnique({
      where: { id },
      include: { ingredients: { orderBy: { id: 'asc' } } },
    }),
    getTargets(),
  ])

  if (!meal) notFound()

  // ── Today's protein context ───────────────────────────────────────────────
  const { start, end } = dateRange(new Date())

  const [todayPlan, offPlanMeals] = await Promise.all([
    prisma.mealPlan.findFirst({
      where: { date: { gte: start, lte: end } },
      include: { breakfastMeal: true, dinnerMeal: true, snacks: { include: { meal: true } } },
    }),
    prisma.offPlanMeal.findMany({ where: { date: { gte: start, lte: end } } }),
  ])

  // Protein already consumed today (only from eaten/non-skipped meals + off-plan)
  let consumedProtein = offPlanMeals.reduce((sum, m) => sum + m.proteinG, 0)
  if (todayPlan) {
    if (todayPlan.breakfastEaten && !todayPlan.breakfastSkipped) consumedProtein += todayPlan.breakfastMeal.proteinG
    if (todayPlan.dinnerEaten   && !todayPlan.dinnerSkipped)    consumedProtein += todayPlan.dinnerMeal.proteinG
    for (const s of todayPlan.snacks) {
      if (s.eaten) consumedProtein += s.meal.proteinG
    }
  }

  const remainingProtein = Math.max(0, targets.proteinG - consumedProtein)

  // ── Serving scale ─────────────────────────────────────────────────────────
  // URL param takes priority; otherwise auto-suggest from remaining protein
  let initialScale: number
  if (scaleStr) {
    const parsed = parseFloat(scaleStr)
    initialScale = snapScale(isNaN(parsed) ? 1 : Math.min(3, Math.max(0.5, parsed)))
  } else {
    const auto = meal.proteinG > 0
      ? Math.min(3, Math.max(1, remainingProtein / meal.proteinG))
      : 1
    initialScale = snapScale(auto)
  }

  const isSuggested = initialScale > 1

  // ── Parse instructions ────────────────────────────────────────────────────
  let instructions: string[] = []
  if (meal.instructions) {
    try {
      instructions = JSON.parse(meal.instructions)
    } catch {
      instructions = meal.instructions.split('\n').filter(Boolean)
    }
  }

  const ingredients = meal.ingredients.map(ing => ({
    name:     ing.ingredientName,
    quantity: ing.quantity,
    unit:     ing.unit,
  }))

  return (
    <main className="min-h-screen pb-24 px-margin-mobile pt-6 max-w-md mx-auto">
      {/* Back */}
      <Link href="/nutrition" className="flex items-center gap-1 text-secondary text-body-sm mb-lg -ml-0.5">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Today
      </Link>

      {/* Header */}
      <div className="mb-md">
        <span className="text-[10px] text-secondary bg-surface-container-high px-2 py-0.5 rounded-full">
          {TYPE_LABEL[meal.type] ?? meal.type}
        </span>
        <h1 className="text-headline-lg-mobile text-on-surface mt-xs leading-tight">{meal.name}</h1>
      </div>

      {/* Protein context banner */}
      {todayPlan && (
        <div className="bg-surface-container border border-surface-container-highest rounded-xl px-md py-sm mb-lg">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5">info</span>
            <p className="text-body-sm text-secondary">
              <span className="text-on-surface font-semibold">{Math.round(remainingProtein)}g protein</span> still needed today
              {' '}({Math.round(consumedProtein)}g of {targets.proteinG}g consumed).
              {isSuggested && (
                <span className="text-primary-container font-semibold">
                  {' '}Eating at {initialScale}× scales this meal to ~{Math.round(meal.proteinG * initialScale)}g protein.
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Serving adjuster + ingredients + method — client component */}
      <ServingAdjuster
        meal={{ kcal: meal.kcal, proteinG: meal.proteinG, fatG: meal.fatG, carbsG: meal.carbsG }}
        ingredients={ingredients}
        instructions={instructions}
        initialScale={initialScale}
      />
    </main>
  )
}
