import { getShoppingList, getWeekDates } from '@/lib/nutrition'
import ShoppingList from '@/components/ShoppingList'

export const dynamic = 'force-dynamic'

function fmtShort(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default async function ShoppingPage() {
  const [aisles, nextWeekDays] = await Promise.all([
    getShoppingList(),
    Promise.resolve(getWeekDates(1)),
  ])

  const weekLabel = `${fmtShort(nextWeekDays[0])} – ${fmtShort(nextWeekDays[6])}`

  return (
    <main className="min-h-screen pb-24 px-margin-mobile pt-6 max-w-md mx-auto">
      <div className="mb-lg">
        <h1 className="text-headline-lg-mobile text-on-surface">Shopping List</h1>
        <p className="text-label-caps text-secondary mt-0.5">Next week · {weekLabel}</p>
      </div>

      {aisles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="material-symbols-outlined text-secondary text-5xl">shopping_cart</span>
          <p className="text-body-sm text-secondary text-center">
            No ingredients found for next week. Check that meals are planned.
          </p>
        </div>
      ) : (
        <ShoppingList aisles={aisles} />
      )}
    </main>
  )
}
