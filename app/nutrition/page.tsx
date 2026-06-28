import { prisma } from '@/lib/prisma'
import { getOrCreateTodaysPlan, getTargets, dateRange, sumMacros } from '@/lib/nutrition'
import MealCard from '@/components/MealCard'
import MacroSummary from '@/components/MacroSummary'
import TargetsForm from '@/components/TargetsForm'
import RegenerateButton from '@/components/RegenerateButton'
import OffPlanLogger from '@/components/OffPlanLogger'
import LunchEatenToggle from '@/components/LunchEatenToggle'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NutritionPage() {
  const [plan, targets] = await Promise.all([
    getOrCreateTodaysPlan(),
    getTargets(),
  ])

  if (!plan) return null

  // Yesterday's dinner = today's lunch carry-forward
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const { start: yStart, end: yEnd } = dateRange(yesterday)
  const yPlan = await prisma.mealPlan.findFirst({
    where: { date: { gte: yStart, lte: yEnd } },
    include: { dinnerMeal: true },
  })
  const lunch = yPlan?.dinnerMeal ?? null

  // Off-plan meals logged today
  const { start: todayStart, end: todayEnd } = dateRange(new Date())
  const offPlanMeals = await prisma.offPlanMeal.findMany({
    where: { date: { gte: todayStart, lte: todayEnd } },
    orderBy: { id: 'asc' },
  })

  // Lunch macros count only if eaten and not skipped
  const lunchM = (lunch && plan.lunchEaten && !plan.lunchSkipped)
    ? { kcal: lunch.kcal, proteinG: lunch.proteinG, fatG: lunch.fatG, carbsG: lunch.carbsG }
    : { kcal: 0, proteinG: 0, fatG: 0, carbsG: 0 }

  const offPlanM = offPlanMeals.reduce(
    (acc, m) => ({ kcal: acc.kcal + m.kcal, proteinG: acc.proteinG + m.proteinG, fatG: acc.fatG + m.fatG, carbsG: acc.carbsG + m.carbsG }),
    { kcal: 0, proteinG: 0, fatG: 0, carbsG: 0 },
  )

  const total = sumMacros([
    plan.breakfastSkipped ? { kcal: 0, proteinG: 0, fatG: 0, carbsG: 0 } : { kcal: plan.breakfastMeal.kcal, proteinG: plan.breakfastMeal.proteinG, fatG: plan.breakfastMeal.fatG, carbsG: plan.breakfastMeal.carbsG },
    lunchM,
    plan.dinnerSkipped    ? { kcal: 0, proteinG: 0, fatG: 0, carbsG: 0 } : { kcal: plan.dinnerMeal.kcal,    proteinG: plan.dinnerMeal.proteinG,    fatG: plan.dinnerMeal.fatG,    carbsG: plan.dinnerMeal.carbsG    },
    ...plan.snacks.map(s => ({ kcal: s.meal.kcal, proteinG: s.meal.proteinG, fatG: s.meal.fatG, carbsG: s.meal.carbsG })),
    offPlanM,
  ])

  const todayLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  const hasOffPlan = offPlanMeals.length > 0
  const overKcal = total.kcal - targets.kcal

  return (
    <main className="min-h-screen pb-24 px-margin-mobile pt-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="text-headline-lg-mobile text-on-surface">Nutrition</h1>
          <p className="text-label-caps text-secondary mt-0.5">{todayLabel}</p>
        </div>
        <RegenerateButton />
      </div>

      {/* Tabs */}
      <div className="flex mb-lg border-b border-surface-container-highest">
        <span className="flex-1 text-center pb-sm text-label-caps font-bold text-primary-container border-b-2 border-primary-container -mb-px">
          TODAY
        </span>
        <Link
          href="/nutrition/week"
          className="flex-1 text-center pb-sm text-label-caps text-secondary border-b-2 border-transparent -mb-px"
        >
          THIS WEEK
        </Link>
      </div>

      {/* Macro summary */}
      <MacroSummary total={total} targets={targets} />

      {/* Off-plan adaptation banner */}
      {hasOffPlan && (
        <div className="bg-surface-container border border-surface-container-highest rounded-xl px-md py-sm mb-md flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-secondary">info</span>
          <p className="text-body-sm text-secondary flex-1">
            Remaining plan re-fitted around {offPlanMeals.length} off-plan meal{offPlanMeals.length > 1 ? 's' : ''}.
            {' '}
            {Math.abs(overKcal) < 50
              ? 'Budget fully absorbed.'
              : overKcal > 0
                ? `Projected ${Math.round(overKcal)} kcal over target.`
                : `Projected ${Math.round(-overKcal)} kcal under target.`}
          </p>
        </div>
      )}

      {/* Meals */}
      <div className="space-y-md mb-md">
        <MealCard
          label="Breakfast"
          meal={plan.breakfastMeal}
          slot="breakfast"
          locked={plan.breakfastLocked}
          eaten={plan.breakfastEaten}
          skipped={plan.breakfastSkipped}
        />

        {/* Lunch — yesterday's dinner as leftover */}
        <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md">
          <div className="flex items-center gap-2 mb-md">
            <span className="material-symbols-outlined text-primary-container">wb_sunny</span>
            <h3 className="text-headline-md text-on-surface">Lunch</h3>
            <span className="text-[10px] text-secondary bg-surface-container-high px-2 py-0.5 rounded-full ml-auto">
              yesterday&apos;s dinner
            </span>
            {lunch && (
              <LunchEatenToggle eaten={plan.lunchEaten} skipped={plan.lunchSkipped} />
            )}
          </div>
          {lunch ? (
            <div className={`flex gap-md items-start transition-opacity ${(!plan.lunchEaten || plan.lunchSkipped) ? 'opacity-50' : ''}`}>
              <div className="flex-1">
                <p className="text-body-lg text-on-surface font-semibold">{lunch.name}</p>
                <div className="flex gap-sm mt-xs flex-wrap">
                  <span className="text-[10px] bg-surface-container-high px-2 py-0.5 rounded text-secondary">P: {lunch.proteinG}g</span>
                  <span className="text-[10px] bg-surface-container-high px-2 py-0.5 rounded text-secondary">C: {lunch.carbsG}g</span>
                  <span className="text-[10px] bg-surface-container-high px-2 py-0.5 rounded text-secondary">F: {lunch.fatG}g</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-headline-md text-primary-container">{lunch.kcal}</p>
                <p className="text-[10px] text-secondary">KCAL</p>
              </div>
            </div>
          ) : (
            <p className="text-body-sm text-secondary italic">No plan yesterday — no leftovers</p>
          )}
        </div>

        <MealCard
          label="Dinner"
          meal={plan.dinnerMeal}
          slot="dinner"
          locked={plan.dinnerLocked}
          eaten={plan.dinnerEaten}
          skipped={plan.dinnerSkipped}
        />

        {/* Snacks */}
        {plan.snacks.length > 0 && (
          <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md">
            <div className="flex items-center gap-2 mb-md">
              <span className="material-symbols-outlined text-primary-container">timer</span>
              <h3 className="text-headline-md text-on-surface">Snacks</h3>
              <span className="text-[10px] text-secondary bg-surface-container-high px-2 py-0.5 rounded-full ml-auto">auto</span>
            </div>
            <div className="space-y-sm">
              {plan.snacks.map(s => (
                <div key={s.id} className={`flex items-center justify-between bg-surface-container-high p-sm rounded-lg ${s.eaten ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-[20px]">nutrition</span>
                    <div>
                      <p className="text-body-sm text-on-surface font-semibold">{s.meal.name}</p>
                      <p className="text-[10px] text-secondary">P: {s.meal.proteinG}g | C: {s.meal.carbsG}g | F: {s.meal.fatG}g</p>
                    </div>
                  </div>
                  <p className="text-headline-md text-primary-container">{s.meal.kcal}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Off-plan meals logger */}
        <OffPlanLogger existing={offPlanMeals} />
      </div>

      {/* Targets */}
      <TargetsForm targets={targets} />
    </main>
  )
}
