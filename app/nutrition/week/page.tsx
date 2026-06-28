import { getOrCreateWeekPlan, sumMacros } from '@/lib/nutrition'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function fmtShort(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function weekRangeLabel(days: Date[]) {
  return `${fmtShort(days[0])} – ${fmtShort(days[6])}`
}

export default async function NutritionWeekPage() {
  const weekDays = await getOrCreateWeekPlan()

  return (
    <main className="min-h-screen pb-24 px-margin-mobile pt-6 max-w-md mx-auto">
      {/* Header */}
      <div className="mb-lg">
        <h1 className="text-headline-lg-mobile text-on-surface">Nutrition</h1>
        <p className="text-label-caps text-secondary mt-0.5">
          {weekRangeLabel(weekDays.map(d => d.date))}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex mb-lg border-b border-surface-container-highest">
        <Link
          href="/nutrition"
          className="flex-1 text-center pb-sm text-label-caps text-secondary border-b-2 border-transparent -mb-px"
        >
          TODAY
        </Link>
        <span className="flex-1 text-center pb-sm text-label-caps font-bold text-primary-container border-b-2 border-primary-container -mb-px">
          THIS WEEK
        </span>
      </div>

      {/* Day cards */}
      <ul className="space-y-sm">
        {weekDays.map(({ date, isToday, plan }) => {
          const dayIdx = (date.getDay() + 6) % 7 // Mon=0…Sun=6
          const total = sumMacros([
            { kcal: plan.breakfastMeal.kcal, proteinG: plan.breakfastMeal.proteinG, fatG: plan.breakfastMeal.fatG, carbsG: plan.breakfastMeal.carbsG },
            { kcal: plan.dinnerMeal.kcal,    proteinG: plan.dinnerMeal.proteinG,    fatG: plan.dinnerMeal.fatG,    carbsG: plan.dinnerMeal.carbsG    },
            ...plan.snacks.map(s => ({ kcal: s.meal.kcal, proteinG: s.meal.proteinG, fatG: s.meal.fatG, carbsG: s.meal.carbsG })),
          ])

          const card = (
            <div className={`bg-surface-container rounded-xl p-md border transition-colors ${
              isToday
                ? 'border-primary-container/60'
                : 'border-surface-container-highest'
            }`}>
              {/* Day header */}
              <div className="flex items-center justify-between mb-sm">
                <div className="flex items-center gap-2">
                  <span className={`text-label-caps font-bold ${isToday ? 'text-primary-container' : 'text-on-surface'}`}>
                    {DAY_NAMES[dayIdx].toUpperCase()}
                  </span>
                  <span className="text-label-caps text-secondary">{fmtShort(date)}</span>
                  {isToday && (
                    <span className="text-[10px] font-bold bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full">
                      TODAY
                    </span>
                  )}
                </div>
                <span className={`text-headline-md font-bold ${isToday ? 'text-primary-container' : 'text-on-surface'}`}>
                  {total.kcal.toLocaleString()}
                  <span className="text-[10px] font-normal text-secondary ml-1">kcal</span>
                </span>
              </div>

              {/* Meals */}
              <div className="space-y-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[16px]">wb_sunny</span>
                  <span className="text-body-sm text-on-surface truncate">{plan.breakfastMeal.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[16px]">bedtime</span>
                  <span className="text-body-sm text-on-surface truncate">{plan.dinnerMeal.name}</span>
                </div>
                {plan.snacks.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[16px]">nutrition</span>
                    <span className="text-body-sm text-secondary">
                      {plan.snacks.length} {plan.snacks.length === 1 ? 'snack' : 'snacks'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )

          // Today's card links to the today view; others are read-only
          return (
            <li key={date.toISOString()}>
              {isToday ? (
                <Link href="/nutrition" className="block active:opacity-80 transition-opacity">
                  {card}
                </Link>
              ) : (
                card
              )}
            </li>
          )
        })}
      </ul>
    </main>
  )
}
