'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/orders', label: 'Orders', icon: '📦' },
  { href: '/confirmation', label: 'Confirmation', icon: '✅' },
  { href: '/customers', label: 'Customers', icon: '👥' },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-5 border-b border-slate-100">
        <div className="text-xl font-bold text-teal-700">LelaModa</div>
        <div className="text-xs text-slate-400 mt-0.5">Operations</div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => {
          const active = path.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                active
                  ? 'bg-teal-50 text-teal-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="text-xs text-slate-400">v1.0 — COD Platform</div>
      </div>
    </aside>
  )
}
