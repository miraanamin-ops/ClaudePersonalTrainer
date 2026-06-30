// Conditioning / Hyrox-style sessions. These sit OUTSIDE the progression engine:
// they are surfaced on a session-count cadence, auto-filled from a rotating
// library, and logged to their own table. They never feed the double-progression
// weight/rep history.

// Surface a conditioning session after this many lifting sessions since the last
// one. ~2 weeks at 4 lifts/week. Tunable.
export const CONDITIONING_THRESHOLD = 8

export type ConditioningResultType = 'time' | 'rounds' | 'none'

export type Wod = {
  title: string
  format: string
  prescription: string[]
  resultType: ConditioningResultType
  note: string
}

// Equipment assumed: dumbbells/kettlebells, rower/bike, box, pull-up bar,
// med balls, and a Hyrox area (sled, wall balls, farmers carry, sandbag).
export const WOD_LIBRARY: Wod[] = [
  {
    title: 'Hyrox Simulator',
    format: 'For Time',
    prescription: [
      '1000 m row',
      '50 m sled push',
      '40 wall balls (9/6 kg)',
      '50 m sled pull',
      '30 walking lunges',
    ],
    resultType: 'time',
    note: 'The full Hyrox flavour. Pace the row — the sled is where time disappears. Break wall balls into sets of 10 from the start.',
  },
  {
    title: 'KB Engine Builder',
    format: 'AMRAP 14',
    prescription: [
      '15 kettlebell swings (24 kg)',
      '12 goblet squats',
      '250 m row',
    ],
    resultType: 'rounds',
    note: 'Hold a pace you could keep for 20 minutes. Unbroken swings, smooth and steady on the row.',
  },
  {
    title: 'The Classic 21-15-9',
    format: 'For Time',
    prescription: [
      '21-15-9 reps of:',
      'Wall balls (9/6 kg)',
      'Kettlebell swings (24 kg)',
      'Burpees',
    ],
    resultType: 'time',
    note: 'Break each set before you hit failure — small planned rests beat one big blow-up.',
  },
  {
    title: 'DB Grunt',
    format: '5 Rounds For Time',
    prescription: [
      '12 dumbbell thrusters',
      '12 dumbbell rows (6 each side)',
      '12 box step-ups',
    ],
    resultType: 'time',
    note: 'Pick a dumbbell pair you can thruster unbroken for the first two rounds.',
  },
  {
    title: 'Row & Carry',
    format: '4 Rounds For Time',
    prescription: [
      '300 m row',
      '50 m farmers carry',
      '10 med-ball slams',
    ],
    resultType: 'time',
    note: 'Grip-heavy. Don’t set the carry down mid-length — walk with intent.',
  },
  {
    title: 'Engine Intervals',
    format: '6 Rounds · rest 90s',
    prescription: [
      '250 m row OR 0.5 km bike — max effort',
      'rest 90 seconds',
      '… repeat for 6 rounds',
    ],
    resultType: 'none',
    note: 'Near-max on every interval, full recovery between. Quality over survival — log how it felt.',
  },
  {
    title: 'Lunges & Lungs',
    format: 'AMRAP 12',
    prescription: [
      '20 m sandbag (or walking) lunges',
      '15 wall balls (9/6 kg)',
      '10 box jumps',
    ],
    resultType: 'rounds',
    note: 'Lower body and lungs. Step down off the box each rep — protect the achilles.',
  },
  {
    title: 'EMOM 21',
    format: 'Every Minute (7 rounds)',
    prescription: [
      'Min 1: 15/12 cal bike or row',
      'Min 2: 12 kettlebell swings (24 kg)',
      'Min 3: 10 burpees',
      '… rotate the three for 21 minutes',
    ],
    resultType: 'none',
    note: 'Aim for ~40 seconds of work each minute so you keep a little rest. Note if you had to scale any minute.',
  },
]

// Rotate through the library by how many conditioning sessions have been logged.
export function nextWod(completedCount: number): Wod {
  const len = WOD_LIBRARY.length
  return WOD_LIBRARY[((completedCount % len) + len) % len]
}

export function conditioningDue(liftsSinceLast: number): boolean {
  return liftsSinceLast >= CONDITIONING_THRESHOLD
}
