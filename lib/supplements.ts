import { prisma } from './prisma'
import { dateRange } from './nutrition'

export type SupplementSettings = {
  waterTargetMl: number
  waterServingMl: number
  creatineDoseG: number
}

const DEFAULT_SETTINGS: SupplementSettings = {
  waterTargetMl: 2000,
  waterServingMl: 500,
  creatineDoseG: 5,
}

export async function getSupplementSettings(): Promise<SupplementSettings> {
  const s = await prisma.supplementSetting.findFirst({ orderBy: { id: 'desc' } })
  return s
    ? { waterTargetMl: s.waterTargetMl, waterServingMl: s.waterServingMl, creatineDoseG: s.creatineDoseG }
    : DEFAULT_SETTINGS
}

// ---------------------------------------------------------------------------
// Water schedule — slots derived from target / serving, evenly spread across
// the day. Tick state is stored as a bitmask on the daily WaterIntake record.
// ---------------------------------------------------------------------------

export type WaterSlot = { index: number; label: string; ml: number }

function slotCount(targetMl: number, servingMl: number): number {
  return Math.max(1, Math.round(targetMl / Math.max(1, servingMl)))
}

function formatTime(hourFloat: number): string {
  // Round to the nearest half hour for tidy labels
  const totalMin = Math.round((hourFloat * 60) / 30) * 30
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function waterSchedule(targetMl: number, servingMl: number): WaterSlot[] {
  const n = slotCount(targetMl, servingMl)
  const startHour = 8
  const endHour = 20
  return Array.from({ length: n }, (_, i) => {
    const hour = n === 1 ? 12 : startHour + ((endHour - startHour) * i) / (n - 1)
    return { index: i, label: formatTime(hour), ml: servingMl }
  })
}

export function countCompletedSlots(mask: number, slots: number): number {
  let count = 0
  for (let i = 0; i < slots; i++) {
    if (mask & (1 << i)) count++
  }
  return count
}

export async function getOrCreateTodaysWater() {
  const { start, end } = dateRange(new Date())
  const existing = await prisma.waterIntake.findFirst({ where: { date: { gte: start, lte: end } } })
  if (existing) return existing
  return prisma.waterIntake.create({ data: { date: new Date(), completedMask: 0 } })
}

export async function getOrCreateTodaysCreatine() {
  const { start, end } = dateRange(new Date())
  const existing = await prisma.creatineLog.findFirst({ where: { date: { gte: start, lte: end } } })
  if (existing) return existing
  return prisma.creatineLog.create({ data: { date: new Date(), taken: false } })
}
