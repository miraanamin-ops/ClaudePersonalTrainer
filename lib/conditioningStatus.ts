import { prisma } from './prisma'
import { CONDITIONING_THRESHOLD, conditioningDue, nextWod, type Wod } from './conditioning'

// How conditioning slots into the rotation: count lifting sessions since the last
// conditioning session. Once that reaches the threshold, conditioning is "due" and
// gets surfaced as next-up. Logging a conditioning session resets the count.
export async function getConditioningStatus(): Promise<{
  due: boolean
  liftsSinceLast: number
  threshold: number
  wod: Wod
}> {
  const last = await prisma.conditioningSession.findFirst({ orderBy: { date: 'desc' } })
  const [liftsSinceLast, completedCount] = await Promise.all([
    prisma.workout.count({ where: last ? { date: { gt: last.date } } : {} }),
    prisma.conditioningSession.count(),
  ])
  return {
    due: conditioningDue(liftsSinceLast),
    liftsSinceLast,
    threshold: CONDITIONING_THRESHOLD,
    wod: nextWod(completedCount),
  }
}
