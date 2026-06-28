import { prisma } from './prisma'

export type MacroTotals = {
  kcal: number
  proteinG: number
  fatG: number
  carbsG: number
}

export type NutritionTargets = {
  kcal: number
  proteinG: number
  fatG: number
  carbsG: number
}

const ZERO: MacroTotals = { kcal: 0, proteinG: 0, fatG: 0, carbsG: 0 }

export function dateRange(d: Date) {
  const start = new Date(d); start.setHours(0, 0, 0, 0)
  const end   = new Date(d); end.setHours(23, 59, 59, 999)
  return { start, end }
}

function add(a: MacroTotals, b: MacroTotals): MacroTotals {
  return {
    kcal:     a.kcal     + b.kcal,
    proteinG: a.proteinG + b.proteinG,
    fatG:     a.fatG     + b.fatG,
    carbsG:   a.carbsG   + b.carbsG,
  }
}

function fromMeal(m: { kcal: number; proteinG: number; fatG: number; carbsG: number }): MacroTotals {
  return { kcal: m.kcal, proteinG: m.proteinG, fatG: m.fatG, carbsG: m.carbsG }
}

export function sumMacros(meals: MacroTotals[]): MacroTotals {
  return meals.reduce(add, ZERO)
}

// Tier 2: protein met + kcal in [90%, 110%] range → best
// Tier 1: protein met only
// Tier 0: neither — closest kcal wins
function comboScore(total: MacroTotals, t: NutritionTargets): number {
  const proteinOk = total.proteinG >= t.proteinG
  const kcalOk    = total.kcal >= t.kcal * 0.9 && total.kcal <= t.kcal * 1.1
  const tier      = proteinOk && kcalOk ? 2 : proteinOk ? 1 : 0
  return tier * 1_000_000 - Math.abs(total.kcal - t.kcal)
}

export async function getTargets(): Promise<NutritionTargets> {
  const t = await prisma.nutritionTarget.findFirst({ orderBy: { id: 'desc' } })
  return t
    ? { kcal: t.kcal, proteinG: t.proteinG, fatG: t.fatG, carbsG: t.carbsG }
    : { kcal: 2400, proteinG: 180, fatG: 70, carbsG: 270 }
}

export async function selectMeals(opts: {
  fixedBreakfastId?: number | null
  fixedDinnerId?: number | null
  excludeBreakfastIds?: Set<number>
  excludeDinnerIds?: Set<number>
  yesterdaysDinnerId?: number | null
}): Promise<{ breakfastId: number; dinnerId: number; snackIds: number[] }> {
  const { fixedBreakfastId, fixedDinnerId, yesterdaysDinnerId } = opts
  const excludeB = opts.excludeBreakfastIds ?? new Set<number>()
  const excludeD = opts.excludeDinnerIds    ?? new Set<number>()

  const targets = await getTargets()

  const [allBreakfasts, allDinners, allSnacks] = await Promise.all([
    prisma.meal.findMany({ where: { type: 'breakfast' } }),
    prisma.meal.findMany({ where: { type: 'dinner'    } }),
    prisma.meal.findMany({ where: { type: 'snack'     } }),
  ])

  const lunchMacros = yesterdaysDinnerId
    ? fromMeal(allDinners.find(d => d.id === yesterdaysDinnerId) ?? ZERO as never)
    : ZERO

  // Build candidate lists
  const bPool = fixedBreakfastId != null
    ? allBreakfasts.filter(b => b.id === fixedBreakfastId)
    : allBreakfasts.filter(b => !excludeB.has(b.id))

  const dPool = fixedDinnerId != null
    ? allDinners.filter(d => d.id === fixedDinnerId)
    : allDinners.filter(d => d.id !== yesterdaysDinnerId && !excludeD.has(d.id))

  // Safe fallbacks (shouldn't normally be needed with 6 breakfasts + 13 dinners)
  const bFinal = bPool.length > 0 ? bPool : allBreakfasts
  const dFinal = dPool.length > 0 ? dPool : allDinners.filter(d => d.id !== yesterdaysDinnerId)

  // Enumerate all combos and pick the best
  let bestB = bFinal[0]
  let bestD = dFinal[0] ?? allDinners[0]
  let bestScore = -Infinity

  for (const b of bFinal) {
    for (const d of dFinal) {
      const total = add(add(fromMeal(b), fromMeal(d)), lunchMacros)
      const s = comboScore(total, targets)
      if (s > bestScore) { bestScore = s; bestB = b; bestD = d }
    }
  }

  // Top up protein with snacks, highest protein-per-calorie first, max 2
  const base = add(add(fromMeal(bestB), fromMeal(bestD)), lunchMacros)
  const snackIds: number[] = []

  if (base.proteinG < targets.proteinG) {
    const sorted = [...allSnacks].sort(
      (a, b) => (b.proteinG / Math.max(b.kcal, 1)) - (a.proteinG / Math.max(a.kcal, 1)),
    )
    let runProtein = base.proteinG
    let runKcal    = base.kcal

    for (const snack of sorted) {
      if (runProtein >= targets.proteinG || snackIds.length >= 2) break
      if (runKcal + snack.kcal > targets.kcal * 1.15) continue
      snackIds.push(snack.id)
      runProtein += snack.proteinG
      runKcal    += snack.kcal
    }
  }

  return { breakfastId: bestB.id, dinnerId: bestD.id, snackIds }
}

const planInclude = {
  breakfastMeal: true,
  dinnerMeal: true,
  snacks: { include: { meal: true } },
} as const

export async function getOrCreateTodaysPlan() {
  const { start, end } = dateRange(new Date())
  const existing = await prisma.mealPlan.findFirst({
    where: { date: { gte: start, lte: end } },
    include: planInclude,
  })
  if (existing) return existing

  // Auto-generate
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const { start: yStart, end: yEnd } = dateRange(yesterday)
  const yPlan = await prisma.mealPlan.findFirst({ where: { date: { gte: yStart, lte: yEnd } } })

  const { breakfastId, dinnerId, snackIds } = await selectMeals({
    yesterdaysDinnerId: yPlan?.dinnerMealId ?? null,
  })

  await prisma.mealPlan.create({
    data: {
      date: new Date(),
      breakfastMealId: breakfastId,
      dinnerMealId: dinnerId,
      snacks: { create: snackIds.map(mealId => ({ mealId })) },
    },
  })

  return prisma.mealPlan.findFirst({
    where: { date: { gte: start, lte: end } },
    include: planInclude,
  })
}
