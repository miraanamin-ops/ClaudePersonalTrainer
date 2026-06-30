import { prisma } from '@/lib/prisma'
import { getOrCreateTodaysPlan, getTargets, dateRange, sumMacros } from '@/lib/nutrition'
import MealCard from '@/components/MealCard'
import MacroSummary from '@/components/MacroSummary'
import TargetsForm from '@/components/TargetsForm'
import RegenerateButton from '@/components/RegenerateButton'
import OffPlanLogger from '@/components/OffPlanLogger'
import LunchEatenToggle from '@/components/LunchEatenToggle'
import SnackCard from '@/components/SnackCard'
import WaterTracker from '@/components/WaterTracker'
import CreatineCard from '@/components/CreatineCard'
import SupplementTargetsForm from '@/components/SupplementTargetsForm'
import { getSupplementSettings, getOrCreateTodaysWater, getOrCreateTodaysCreatine, waterSchedule } from '@/lib/supplements'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NutritionPage() {
  const [plan, targets, suppSettings, water, creatine] = await Promise.all([
    getOrCreateTodaysPlan(),
    getTargets(),
    getSupplementSettings(),
    getOrCreateTodaysWater(),
    getOrCreateTodaysCreatine(),
  ])

  if (!plan) return null

  const waterSlots = waterSchedule(suppSettings.waterTargetMl, suppSettings.waterServingMl)

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
    ...plan.snacks.filter(s => !s.skipped).map(s => ({ kcal: s.meal.kcal, proteinG: s.meal.proteinG, fatG: s.meal.fatG, carbsG: s.meal.carbsG })),
    offPlanM,
  ])

  // Protein consumed from already-eaten meals + off-plan (drives recipe scale suggestions)
  const consumedProtein =
    (plan.breakfastEaten && !plan.breakfastSkipped ? plan.breakfastMeal.proteinG : 0) +
    (plan.lunchEaten     && !plan.lunchSkipped     ? (lunch?.proteinG ?? 0)       : 0) +
    plan.snacks.filter(s => s.eaten).reduce((sum, s) => sum + s.meal.proteinG, 0) +
    offPlanM.proteinG

  const remainingProtein = Math.max(0, targets.proteinG - consumedProtein)

  function slotScale(mealProtein: number): number {
    if (mealProtein <= 0) return 1
    return Math.min(2.5, Math.max(1, remainingProtein / mealProtein))
  }

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
        <Link
          href="/nutrition/next-week"
          className="flex-1 text-center pb-sm text-label-caps text-secondary border-b-2 border-transparent -mb-px"
        >
          NEXT WEEK
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
          recipeScale={slotScale(plan.breakfastMeal.proteinG)}
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
                <Link
                  href={`/nutrition/meals/${lunch.id}?scale=${slotScale(lunch.proteinG).toFixed(2)}`}
                  className="flex items-center gap-0.5 text-[10px] text-secondary hover:text-primary-container transition-colors mt-0.5 w-fit"
                >
                  <span className="material-symbols-outlined text-[12px]">menu_book</span>
                  View recipe
                </Link>
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
          recipeScale={slotScale(plan.dinnerMeal.proteinG)}
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
                <SnackCard key={s.id} snack={s} />
              ))}
            </div>
          </div>
        )}

        {/* Creatine supplement */}
        <CreatineCard doseG={suppSettings.creatineDoseG} taken={creatine.taken} />

        {/* Water intake */}
        <WaterTracker
          slots={waterSlots}
          completedMask={water.completedMask}
          targetMl={suppSettings.waterTargetMl}
        />

        {/* Off-plan meals logger */}
        <OffPlanLogger existing={offPlanMeals} />
      </div>

      {/* Targets */}
      <div className="space-y-md">
        <TargetsForm targets={targets} />
        <SupplementTargetsForm
          waterTargetMl={suppSettings.waterTargetMl}
          creatineDoseG={suppSettings.creatineDoseG}
        />
      </div>
    </main>
  )
}
