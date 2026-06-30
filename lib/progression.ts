export type ExerciseConfig = {
  repRangeLow: number
  repRangeHigh: number
  incrementKg: number
  isPriority: boolean
}

export type SetRecord = {
  weightKg: number
  reps: number
  rir: number
}

export type MesocycleContext = {
  blockNumber: number
  lengthWeeks: number
  currentWeek: number
  workoutsPerWeek: number
}

export type Prescription = {
  targetWeightKg: number | null
  targetReps: number
  targetRIR: number   // adjusted for today's readiness
  baseRIR: number     // mesocycle schedule target (before readiness adjustment)
  targetSets: number
  note: string
  earlyDeloadWarning: boolean
  isDeload: boolean
  action: 'first' | 'increase' | 'hold' | 'deload'
  lastWorkingSets: SetRecord[]  // last session's sets at the working weight (empty if first session)
}

export function getWeeklyTargetRIR(
  blockNumber: number,
  currentWeek: number,
  lengthWeeks: number,
): number {
  if (currentWeek > lengthWeeks) return 4
  if (blockNumber <= 2) return 3
  return Math.max(0, 3 - (currentWeek - 1))
}

export function prescribeExercise(
  exercise: ExerciseConfig,
  mesocycle: MesocycleContext,
  baselineSets: number,
  lastSets: SetRecord[],
  rirAdjustment: number = 0,
): Prescription {
  const isDeload = mesocycle.currentWeek > mesocycle.lengthWeeks
  const isBeginner = mesocycle.blockNumber <= 2
  const weekInBlock = Math.min(mesocycle.currentWeek, mesocycle.lengthWeeks)

  const baseRIR = getWeeklyTargetRIR(mesocycle.blockNumber, mesocycle.currentWeek, mesocycle.lengthWeeks)
  // Readiness adjustment applies only to hard weeks (not deload — already easy)
  const targetRIR = isDeload ? baseRIR : Math.min(baseRIR + rirAdjustment, 5)

  let targetSets: number
  if (isDeload) {
    targetSets = Math.ceil(baselineSets / 2)
  } else if (isBeginner || !exercise.isPriority) {
    targetSets = baselineSets
  } else {
    const extraSets = Math.min(Math.max(0, weekInBlock - 2), 2)
    targetSets = baselineSets + extraSets
  }

  if (lastSets.length === 0) {
    return {
      targetWeightKg: null,
      targetReps: exercise.repRangeLow,
      targetRIR,
      baseRIR,
      targetSets,
      note: 'First session — pick a comfortable starting weight',
      earlyDeloadWarning: false,
      isDeload,
      action: 'first',
      lastWorkingSets: [],
    }
  }

  // Working weight = the heaviest load carried for at least one set. Lighter sets
  // (ramp-up / feeler / warm-up) are ignored when judging progression, so a session
  // logged as 14→18→20→20 is read as "20 kg", not "14 kg" (the first set).
  const workingWeight = Math.max(...lastSets.map(s => s.weightKg))
  const workingSets = lastSets.filter(s => s.weightKg >= workingWeight - 1e-6)

  if (isDeload) {
    return {
      targetWeightKg: workingWeight,
      targetReps: exercise.repRangeLow,
      targetRIR: 4,
      baseRIR: 4,
      targetSets,
      note: 'Deload week — keep it easy, stop well short of failure',
      earlyDeloadWarning: false,
      isDeload: true,
      action: 'deload',
      lastWorkingSets: workingSets,
    }
  }

  const avgRIR = workingSets.reduce((sum, s) => sum + s.rir, 0) / workingSets.length
  // Progression decision uses baseRIR — what last session was measured against
  const rirDiff = avgRIR - baseRIR
  const allAtTop = workingSets.every(s => s.reps >= exercise.repRangeHigh)
  const bestReps = Math.max(...workingSets.map(s => s.reps))

  if (rirDiff >= 3) {
    return {
      targetWeightKg: workingWeight + 2 * exercise.incrementKg,
      targetReps: exercise.repRangeLow,
      targetRIR,
      baseRIR,
      targetSets,
      note: `Weight up ×2 — avg RIR ${avgRIR.toFixed(1)} vs target ${baseRIR} last session`,
      earlyDeloadWarning: false,
      isDeload: false,
      action: 'increase',
      lastWorkingSets: workingSets,
    }
  }

  if (rirDiff >= 1) {
    return {
      targetWeightKg: workingWeight + exercise.incrementKg,
      targetReps: exercise.repRangeLow,
      targetRIR,
      baseRIR,
      targetSets,
      note: `Weight up — avg RIR ${avgRIR.toFixed(1)} vs target ${baseRIR} last session`,
      earlyDeloadWarning: false,
      isDeload: false,
      action: 'increase',
      lastWorkingSets: workingSets,
    }
  }

  if (rirDiff < -1.5) {
    return {
      targetWeightKg: workingWeight,
      targetReps: Math.max(bestReps, exercise.repRangeLow),
      targetRIR,
      baseRIR,
      targetSets,
      note: `Holding weight — avg RIR ${avgRIR.toFixed(1)} vs target ${baseRIR} last session`,
      earlyDeloadWarning: true,
      isDeload: false,
      action: 'hold',
      lastWorkingSets: workingSets,
    }
  }

  if (allAtTop) {
    return {
      targetWeightKg: workingWeight + exercise.incrementKg,
      targetReps: exercise.repRangeLow,
      targetRIR,
      baseRIR,
      targetSets,
      note: `Weight up — you hit ${exercise.repRangeHigh} reps across all working sets`,
      earlyDeloadWarning: false,
      isDeload: false,
      action: 'increase',
      lastWorkingSets: workingSets,
    }
  }

  const nextReps = Math.min(bestReps + 1, exercise.repRangeHigh)
  return {
    targetWeightKg: workingWeight,
    targetReps: nextReps,
    targetRIR,
    baseRIR,
    targetSets,
    note: `Same weight — push for ${nextReps} reps (best was ${bestReps} last session)`,
    earlyDeloadWarning: false,
    isDeload: false,
    action: 'hold',
    lastWorkingSets: workingSets,
  }
}
