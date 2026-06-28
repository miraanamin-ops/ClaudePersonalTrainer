'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/',          icon: 'home',           label: 'Home'     },
  { href: '/workouts',  icon: 'fitness_center',  label: 'Workout'  },
  { href: '/nutrition', icon: 'restaurant',      label: 'Food'     },
  { href: '/recovery',  icon: 'bedtime',         label: 'Recovery' },
  { href: '/body',      icon: 'person',          label: 'Body'     },
  { href: '/block',     icon: 'calendar_month',  label: 'Block'    },
  { href: '/shopping',  icon: 'shopping_cart',   label: 'Shop'     },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 w-full h-[68px] bg-surface-container border-t border-surface-container-highest flex justify-around items-center z-50">
      {navItems.map(({ href, icon, label }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors active:scale-90 duration-200 min-w-0 flex-1 ${
              isActive ? 'text-primary-container' : 'text-secondary hover:text-primary-fixed-dim'
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={isActive ? { fontVariationSettings: "'FILL' 1, 'wght' 600" } : undefined}
            >
              {icon}
            </span>
            <span className="text-[9px] font-semibold tracking-wider uppercase">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
