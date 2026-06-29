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
  extraConsumed?: MacroTotals
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

  // baseConsumed = lunch carry-forward + off-plan meals + any already-eaten snacks
  // (breakfast/dinner macros flow through the combo loop via bestB/bestD, not here)
  const baseConsumed = add(lunchMacros, opts.extraConsumed ?? ZERO)

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
      const total = add(add(fromMeal(b), fromMeal(d)), baseConsumed)
      const s = comboScore(total, targets)
      if (s > bestScore) { bestScore = s; bestB = b; bestD = d }
    }
  }

  // Select snacks within the kcal budget, protein-dense first (max 2).
  // Always attempts to add snacks regardless of whether the protein target is
  // already met — this ensures snack ingredients always appear on the shopping
  // list and gives the user something to eat/skip each day.
  const base = add(add(fromMeal(bestB), fromMeal(bestD)), baseConsumed)
  const snackIds: number[] = []

  const sortedSnacks = [...allSnacks].sort(
    (a, b) => (b.proteinG / Math.max(b.kcal, 1)) - (a.proteinG / Math.max(a.kcal, 1)),
  )
  let runKcal = base.kcal
  for (const snack of sortedSnacks) {
    if (snackIds.length >= 2) break
    if (runKcal + snack.kcal > targets.kcal * 1.15) continue
    snackIds.push(snack.id)
    runKcal += snack.kcal
  }

  return { breakfastId: bestB.id, dinnerId: bestD.id, snackIds }
}

// Re-fits today's (or any day's) plan around fixed meals (eaten/locked) and
// off-plan meals already logged.  Called after every mutation that changes the
// consumed-vs-planned balance.
export async function refitDay(date: Date) {
  const { start, end } = dateRange(date)
  const plan = await prisma.mealPlan.findFirst({
    where: { date: { gte: start, lte: end } },
    include: planInclude,
  })
  if (!plan) return

  // Yesterday's dinner for the lunch carry-forward (only if lunchEaten)
  const yDay = new Date(date)
  yDay.setDate(yDay.getDate() - 1)
  const { start: yS, end: yE } = dateRange(yDay)
  const yPlan = await prisma.mealPlan.findFirst({
    where: { date: { gte: yS, lte: yE } },
    select: { dinnerMealId: true },
  })

  // Off-plan meals logged today
  const offPlanMeals = await prisma.offPlanMeal.findMany({ where: { date: { gte: start, lte: end } } })

  // extraConsumed = off-plan macros + already-eaten snack macros.
  // Breakfast/dinner macros come through the combo loop via fixedBreakfastId/fixedDinnerId.
  let extraConsumed: MacroTotals = ZERO
  for (const m of offPlanMeals) {
    extraConsumed = add(extraConsumed, { kcal: m.kcal, proteinG: m.proteinG, fatG: m.fatG, carbsG: m.carbsG })
  }
  for (const s of plan.snacks) {
    if (s.eaten) extraConsumed = add(extraConsumed, fromMeal(s.meal))
  }

  const { breakfastId, dinnerId, snackIds } = await selectMeals({
    fixedBreakfastId:   (plan.breakfastEaten || plan.breakfastLocked) ? plan.breakfastMealId : null,
    fixedDinnerId:      (plan.dinnerEaten    || plan.dinnerLocked)    ? plan.dinnerMealId    : null,
    yesterdaysDinnerId: plan.lunchEaten ? (yPlan?.dinnerMealId ?? null) : null,
    extraConsumed,
  })

  await prisma.mealPlan.update({
    where: { id: plan.id },
    data: { breakfastMealId: breakfastId, dinnerMealId: dinnerId },
  })

  // Preserve eaten and skipped snacks; replace only pending (uneaten, unskipped) ones
  await prisma.mealPlanSnack.deleteMany({ where: { mealPlanId: plan.id, eaten: false, skipped: false } })
  if (snackIds.length > 0) {
    await prisma.mealPlanSnack.createMany({
      data: snackIds.map(mealId => ({ mealPlanId: plan.id, mealId })),
    })
  }
}

const planInclude = {
  breakfastMeal: true,
  dinnerMeal: true,
  snacks: { include: { meal: true } },
} as const

export function getWeekDates(weekOffset = 0): Date[] {
  const now = new Date()
  const dow = now.getDay() // 0=Sun … 6=Sat
  const mon = new Date(now)
  mon.setDate(now.getDate() - ((dow + 6) % 7) + weekOffset * 7)
  mon.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d
  })
}

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type FullPlan = NonNullable<Awaited<ReturnType<typeof prisma.mealPlan.findFirst<{ include: typeof planInclude }>>>>

export type WeekDay = { date: Date; isToday: boolean; plan: FullPlan }

export async function getOrCreateWeekPlan(weekOffset = 0): Promise<WeekDay[]> {
  const days = getWeekDates(weekOffset)
  const todayKey = localDateKey(new Date())

  const weekStart = new Date(days[0])
  const weekEnd = new Date(days[6]); weekEnd.setHours(23, 59, 59, 999)

  // Single query for all existing plans this week
  const existing = await prisma.mealPlan.findMany({
    where: { date: { gte: weekStart, lte: weekEnd } },
    include: planInclude,
    orderBy: { date: 'asc' },
  })
  const byKey = new Map(existing.map(p => [localDateKey(p.date), p]))

  // Seed Monday's lunch carry-forward from last Sunday's dinner
  const lastSunday = new Date(days[0]); lastSunday.setDate(lastSunday.getDate() - 1)
  const { start: lsStart, end: lsEnd } = dateRange(lastSunday)
  const lastSundayPlan = await prisma.mealPlan.findFirst({
    where: { date: { gte: lsStart, lte: lsEnd } },
    select: { dinnerMealId: true },
  })

  let prevDinnerId: number | null = lastSundayPlan?.dinnerMealId ?? null
  const result: WeekDay[] = []

  // Pre-seed used IDs from plans that already exist for this week so new days
  // don't repeat meals that are already locked in earlier in the week.
  const usedBreakfastIds = new Set(existing.map(p => p.breakfastMealId))
  const usedDinnerIds    = new Set(existing.map(p => p.dinnerMealId))

  for (const day of days) {
    const key = localDateKey(day)
    let plan = byKey.get(key) as FullPlan | undefined

    if (!plan) {
      const { breakfastId, dinnerId, snackIds } = await selectMeals({
        yesterdaysDinnerId:  prevDinnerId,
        excludeBreakfastIds: new Set(usedBreakfastIds),
        excludeDinnerIds:    new Set(usedDinnerIds),
      })
      plan = await prisma.mealPlan.create({
        data: {
          date: day,
          breakfastMealId: breakfastId,
          dinnerMealId: dinnerId,
          snacks: { create: snackIds.map(mealId => ({ mealId })) },
        },
        include: planInclude,
      }) as FullPlan

      usedBreakfastIds.add(breakfastId)
      usedDinnerIds.add(dinnerId)
    }

    prevDinnerId = plan.dinnerMealId
    result.push({ date: day, isToday: key === todayKey, plan })
  }

  return result
}

// ---------------------------------------------------------------------------
// Shopping list
// ---------------------------------------------------------------------------

export type ShoppingItem = { name: string; qty: number; unit: string }
export type ShoppingAisle = { aisle: string; items: ShoppingItem[] }

export async function getShoppingList(): Promise<ShoppingAisle[]> {
  const weekPlans = await getOrCreateWeekPlan(1) // next week

  // Collect all unique meal IDs appearing in next week's plans
  const mealIds = new Set<number>()
  for (const { plan } of weekPlans) {
    mealIds.add(plan.breakfastMealId)
    mealIds.add(plan.dinnerMealId)
    for (const snack of plan.snacks) mealIds.add(snack.mealId)
  }

  // Single query for all relevant ingredients
  const allIngredients = await prisma.mealIngredient.findMany({
    where: { mealId: { in: [...mealIds] } },
  })
  const ingByMeal = new Map<number, typeof allIngredients>()
  for (const ing of allIngredients) {
    const list = ingByMeal.get(ing.mealId) ?? []
    list.push(ing)
    ingByMeal.set(ing.mealId, list)
  }

  // Accumulate totals: key = "name|||unit"
  const totals = new Map<string, { name: string; qty: number; unit: string; aisle: string }>()

  function addIngredients(mealId: number, multiplier: number) {
    for (const ing of ingByMeal.get(mealId) ?? []) {
      if (ing.supermarketAisle === 'n/a') continue // water etc.
      const key = `${ing.ingredientName}|||${ing.unit}`
      const existing = totals.get(key)
      if (existing) {
        existing.qty += ing.quantity * multiplier
      } else {
        totals.set(key, {
          name: ing.ingredientName,
          qty: ing.quantity * multiplier,
          unit: ing.unit,
          aisle: ing.supermarketAisle,
        })
      }
    }
  }

  for (const { plan } of weekPlans) {
    addIngredients(plan.breakfastMealId, 1)  // breakfast: single serving
    addIngredients(plan.dinnerMealId, 2)      // dinner: doubled for leftovers
    for (const snack of plan.snacks) addIngredients(snack.mealId, 1)
  }

  // Group by aisle, sort aisles A–Z and items A–Z within each
  const byAisle = new Map<string, ShoppingItem[]>()
  for (const { name, qty, unit, aisle } of totals.values()) {
    const list = byAisle.get(aisle) ?? []
    list.push({ name, qty, unit })
    byAisle.set(aisle, list)
  }

  return [...byAisle.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([aisle, items]) => ({
      aisle,
      items: items.sort((a, b) => a.name.localeCompare(b.name)),
    }))
}

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
