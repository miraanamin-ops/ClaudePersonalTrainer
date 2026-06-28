import { prisma } from '@/lib/prisma'
import { getOrCreateTodaysPlan, getTargets, dateRange, sumMacros } from '@/lib/nutrition'
import MealCard from '@/components/MealCard'
import MacroSummary from '@/components/MacroSummary'
import TargetsForm from '@/components/TargetsForm'
import RegenerateButton from '@/components/RegenerateButton'

export const dynamic = 'force-dynamic'

export default async function NutritionPage() {
  const [plan, targets] = await Promise.all([
    getOrCreateTodaysPlan(),
    getTargets(),
  ])

  if (!plan) return null

  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const { start: yStart, end: yEnd } = dateRange(yesterday)
  const yPlan = await prisma.mealPlan.findFirst({
    where: { date: { gte: yStart, lte: yEnd } },
    include: { dinnerMeal: true },
  })
  const lunch = yPlan?.dinnerMeal ?? null

  const lunchM = lunch
    ? { kcal: lunch.kcal, proteinG: lunch.proteinG, fatG: lunch.fatG, carbsG: lunch.carbsG }
    : { kcal: 0, proteinG: 0, fatG: 0, carbsG: 0 }

  const total = sumMacros([
    { kcal: plan.breakfastMeal.kcal, proteinG: plan.breakfastMeal.proteinG, fatG: plan.breakfastMeal.fatG, carbsG: plan.breakfastMeal.carbsG },
    lunchM,
    { kcal: plan.dinnerMeal.kcal, proteinG: plan.dinnerMeal.proteinG, fatG: plan.dinnerMeal.fatG, carbsG: plan.dinnerMeal.carbsG },
    ...plan.snacks.map(s => ({ kcal: s.meal.kcal, proteinG: s.meal.proteinG, fatG: s.meal.fatG, carbsG: s.meal.carbsG })),
  ])

  const todayLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <main className="min-h-screen pb-24 px-margin-mobile pt-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="text-headline-lg-mobile text-on-surface">Nutrition</h1>
          <p className="text-label-caps text-secondary mt-0.5">{todayLabel}</p>
        </div>
        <RegenerateButton />
      </div>

      {/* Macro summary */}
      <MacroSummary total={total} targets={targets} />

      {/* Meals */}
      <div className="space-y-md mb-md">
        <MealCard label="Breakfast" meal={plan.breakfastMeal} slot="breakfast" locked={plan.breakfastLocked} />

        {/* Lunch — derived */}
        <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md">
          <div className="flex items-center gap-2 mb-md">
            <span className="material-symbols-outlined text-primary-container">wb_sunny</span>
            <h3 className="text-headline-md text-on-surface">Lunch</h3>
            <span className="text-[10px] text-secondary bg-surface-container-high px-2 py-0.5 rounded-full ml-auto">yesterday's dinner</span>
          </div>
          {lunch ? (
            <div className="flex gap-md items-start">
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

        <MealCard label="Dinner" meal={plan.dinnerMeal} slot="dinner" locked={plan.dinnerLocked} />

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
                <div key={s.id} className="flex items-center justify-between bg-surface-container-high p-sm rounded-lg">
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
      </div>

      {/* Targets */}
      <TargetsForm targets={targets} />
    </main>
  )
}
