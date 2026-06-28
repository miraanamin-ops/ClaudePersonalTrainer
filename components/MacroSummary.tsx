import type { MacroTotals, NutritionTargets } from '@/lib/nutrition'

type Props = {
  total: MacroTotals
  targets: NutritionTargets
}

function MacroRing({
  value,
  target,
  label,
  unit,
}: {
  value: number
  target: number
  label: string
  unit: string
}) {
  const pct = Math.min(value / target, 1)
  const circumference = 2 * Math.PI * 28
  const offset = circumference * (1 - pct)

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16 mb-2">
        <svg className="w-full h-full -rotate-90">
          <circle className="text-surface-container-highest" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="4" />
          <circle
            className="text-primary-container transition-all duration-500"
            cx="32" cy="32" fill="transparent" r="28"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-on-surface">
          {Math.round(pct * 100)}%
        </div>
      </div>
      <span className="text-label-caps text-secondary">{label}</span>
      <span className="text-headline-md text-on-surface">{Math.round(value)}{unit}</span>
    </div>
  )
}

export default function MacroSummary({ total, targets }: Props) {
  return (
    <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md mb-md">
      <div className="flex justify-between items-end mb-md">
        <div>
          <span className="text-label-caps text-secondary">TODAY'S FUEL</span>
          <h2 className="text-display-stat text-on-surface">
            {Math.round(total.kcal)}{' '}
            <span className="text-headline-md text-secondary">kcal</span>
          </h2>
        </div>
        <div className="text-right">
          <span className="text-label-caps text-secondary">TARGET</span>
          <p className="text-headline-md text-primary-container">{targets.kcal} kcal</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-gutter">
        <MacroRing value={total.proteinG} target={targets.proteinG} label="PROTEIN" unit="g" />
        <MacroRing value={total.carbsG}   target={targets.carbsG}   label="CARBS"   unit="g" />
        <MacroRing value={total.fatG}     target={targets.fatG}     label="FATS"    unit="g" />
      </div>
    </div>
  )
}
