'use client'

import { useState, useEffect } from 'react'
import type { ShoppingAisle } from '@/lib/nutrition'

const STORAGE_KEY = 'shopping-ticked-v1'

function fmtQty(qty: number): string {
  const rounded = Math.round(qty * 100) / 100
  return rounded % 1 === 0 ? String(rounded) : String(rounded)
}

export default function ShoppingList({ aisles }: { aisles: ShoppingAisle[] }) {
  const [ticked, setTicked] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setTicked(new Set(JSON.parse(stored) as string[]))
    } catch {}
    setMounted(true)
  }, [])

  function toggle(key: string) {
    setTicked(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  function clearAll() {
    setTicked(new Set())
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  const totalItems = aisles.reduce((n, a) => n + a.items.length, 0)
  const tickedCount = mounted ? ticked.size : 0

  return (
    <div>
      {/* Progress bar + clear */}
      <div className="flex items-center justify-between mb-sm">
        <span className="text-label-caps text-secondary">
          {tickedCount} of {totalItems} ticked
        </span>
        {tickedCount > 0 && (
          <button
            onClick={clearAll}
            className="text-label-caps text-secondary hover:text-error transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="h-0.5 bg-surface-container-highest rounded-full mb-lg overflow-hidden">
        <div
          className="h-full bg-primary-container rounded-full transition-all duration-500"
          style={{ width: totalItems > 0 ? `${(tickedCount / totalItems) * 100}%` : '0%' }}
        />
      </div>

      {/* Aisle sections */}
      <div className="space-y-lg">
        {aisles.map(({ aisle, items }) => (
          <section key={aisle}>
            <h2 className="text-label-caps text-secondary uppercase tracking-widest mb-sm px-xs">
              {aisle}
            </h2>
            <ul className="bg-surface-container border border-surface-container-highest rounded-xl overflow-hidden">
              {items.map((item, idx) => {
                const key = `${aisle}|||${item.name}`
                const isChecked = mounted && ticked.has(key)
                return (
                  <li
                    key={key}
                    className={idx > 0 ? 'border-t border-surface-container-highest' : ''}
                  >
                    <button
                      onClick={() => toggle(key)}
                      className={`w-full flex items-center gap-md px-md py-sm text-left transition-opacity active:opacity-60 ${
                        isChecked ? 'opacity-40' : ''
                      }`}
                    >
                      {/* Circle checkbox */}
                      <span
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isChecked
                            ? 'bg-primary-container border-primary-container'
                            : 'border-surface-container-highest'
                        }`}
                      >
                        {isChecked && (
                          <span className="material-symbols-outlined text-on-primary-container"
                            style={{ fontSize: 13, fontVariationSettings: "'wght' 700" }}>
                            check
                          </span>
                        )}
                      </span>

                      {/* Ingredient name */}
                      <span
                        className={`flex-1 text-body-sm text-on-surface ${
                          isChecked ? 'line-through' : ''
                        }`}
                      >
                        {item.name}
                      </span>

                      {/* Quantity */}
                      <span
                        className={`text-label-caps shrink-0 tabular-nums ${
                          isChecked ? 'text-secondary line-through' : 'text-on-surface'
                        }`}
                      >
                        {fmtQty(item.qty)} {item.unit}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
