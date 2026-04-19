'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'This month', days: -1 },
  { label: 'Last month', days: -2 },
  { label: 'All time', days: -99 },
]

function toISO(d: Date) {
  return d.toISOString().split('T')[0]
}

export default function DateRangePicker() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [open, setOpen] = useState(false)

  const fromParam = sp.get('from')
  const toParam = sp.get('to')

  const [from, setFrom] = useState(fromParam || '')
  const [to, setTo] = useState(toParam || '')

  useEffect(() => {
    setFrom(fromParam || '')
    setTo(toParam || '')
  }, [fromParam, toParam])

  function applyPreset(days: number) {
    const now = new Date()
    if (days === -99) {
      // All time — remove params
      router.push(pathname)
      setOpen(false)
      return
    }
    if (days === -1) {
      // This month
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = now
      router.push(`${pathname}?from=${toISO(start)}&to=${toISO(end)}`)
      setOpen(false)
      return
    }
    if (days === -2) {
      // Last month
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      router.push(`${pathname}?from=${toISO(start)}&to=${toISO(end)}`)
      setOpen(false)
      return
    }
    if (days === 0) {
      // Today
      router.push(`${pathname}?from=${toISO(now)}&to=${toISO(now)}`)
      setOpen(false)
      return
    }
    if (days === 1) {
      // Yesterday
      const y = new Date(now); y.setDate(y.getDate() - 1)
      router.push(`${pathname}?from=${toISO(y)}&to=${toISO(y)}`)
      setOpen(false)
      return
    }
    const start = new Date(now); start.setDate(start.getDate() - days + 1); start.setHours(0, 0, 0, 0)
    router.push(`${pathname}?from=${toISO(start)}&to=${toISO(now)}`)
    setOpen(false)
  }

  function applyCustom() {
    if (!from || !to) return
    router.push(`${pathname}?from=${from}&to=${to}`)
    setOpen(false)
  }

  const displayLabel = fromParam && toParam
    ? `${fromParam} → ${toParam}`
    : fromParam
    ? `From ${fromParam}`
    : 'All time'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-700"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gray-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {displayLabel}
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gray-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-20 bg-white border border-gray-200 rounded-xl shadow-lg w-72 p-3">
            {/* Presets */}
            <div className="grid grid-cols-2 gap-1 mb-3">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p.days)}
                  className="text-xs px-3 py-2 rounded-lg text-left hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 transition font-medium"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom range */}
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <div className="text-xs font-medium text-gray-500 mb-1.5">Custom range</div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-gray-700"
                />
                <input
                  type="date"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-gray-700"
                />
              </div>
              <button
                onClick={applyCustom}
                disabled={!from || !to}
                className="w-full py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-lg transition"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
