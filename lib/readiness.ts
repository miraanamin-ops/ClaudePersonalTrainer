export type ReadinessCategory = 'good' | 'moderate' | 'poor' | 'rest'

export type ReadinessEntry = {
  sleepHours: number
  soreness: number
  energy: number
}

// deficitScore: 0 (perfect) → 10 (terrible)
export function computeDeficitScore(sleepHours: number, soreness: number, energy: number): number {
  const sleepPenalty = sleepHours >= 7 ? 0 : sleepHours >= 6 ? 1 : 2
  return (5 - energy) + (soreness - 1) + sleepPenalty
}

export function readinessCategory(deficitScore: number): ReadinessCategory {
  if (deficitScore <= 2) return 'good'
  if (deficitScore <= 5) return 'moderate'
  if (deficitScore <= 7) return 'poor'
  return 'rest'
}

// How many RIR to add on top of the mesocycle's base target
export function rirAdjustment(category: ReadinessCategory): number {
  if (category === 'good') return 0
  if (category === 'moderate') return 1
  return 2  // poor or rest
}

export function categoryLabel(category: ReadinessCategory): string {
  if (category === 'good') return 'Good'
  if (category === 'moderate') return 'Moderate'
  if (category === 'poor') return 'Poor'
  return 'Rest recommended'
}

export function categoryColour(category: ReadinessCategory): string {
  if (category === 'good') return 'text-green-400'
  if (category === 'moderate') return 'text-yellow-400'
  if (category === 'poor') return 'text-orange-400'
  return 'text-red-400'
}

// Actionable nudges based on recent history.
// proteinTargetG / proteinConsumedG come from the live nutrition data so the
// protein nudge reflects the user's actual editable target and today's intake.
export function readinessNudges(
  recent: ReadinessEntry[],
  proteinTargetG: number,
  proteinConsumedG?: number,
): string[] {
  const nudges: string[] = []

  // Sleep nudge: last 3 check-ins all < 7h
  if (recent.length >= 3 && recent.slice(0, 3).every(r => r.sleepHours < 7)) {
    const avg = recent.slice(0, 3).reduce((s, r) => s + r.sleepHours, 0) / 3
    nudges.push(
      `Sleep: you've averaged ${avg.toFixed(1)}h over the last 3 days. Aim for 7–8h — muscle is built during recovery, not training.`,
    )
  }

  // Protein nudge — driven by the real target and (if available) today's intake
  const target = Math.round(proteinTargetG)
  if (proteinConsumedG != null) {
    const remaining = Math.max(0, Math.round(target - proteinConsumedG))
    nudges.push(
      remaining > 0
        ? `Protein: ${remaining}g to go to hit your ${target}g target — protects muscle in a calorie deficit.`
        : `Protein: ${target}g target hit — nice. Protein protects muscle in a calorie deficit.`,
    )
  } else {
    nudges.push(`Protein: aim for ${target}g today to protect muscle in a calorie deficit.`)
  }

  return nudges
}
