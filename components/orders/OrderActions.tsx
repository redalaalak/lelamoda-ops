'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const ALL_STATUSES = [
  { value: 'pending_confirmation', label: 'Pending', color: 'text-amber-600' },
  { value: 'confirmed', label: 'Confirmed', color: 'text-emerald-600' },
  { value: 'to_edit', label: 'To Edit', color: 'text-orange-600' },
  { value: 'canceled_confirmation', label: 'Canceled', color: 'text-red-600' },
  { value: 'processing', label: 'Processing', color: 'text-blue-600' },
  { value: 'shipped', label: 'Shipped', color: 'text-violet-600' },
  { value: 'delivered', label: 'Delivered', color: 'text-emerald-700' },
  { value: 'returned', label: 'Returned', color: 'text-gray-600' },
  { value: 'out_of_stock', label: 'Out of Stock', color: 'text-yellow-700' },
  { value: 'blocked_customer', label: 'Blocked', color: 'text-red-800' },
]

export default function OrderActions({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const changeStatus = async (status: string) => {
    if (status === currentStatus) { setOpen(false); return }
    setLoading(true)
    setOpen(false)
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition disabled:opacity-60"
      >
        {loading ? (
          <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <>
            More actions
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-50">
            Change Status
          </div>
          {ALL_STATUSES.filter(s => s.value !== currentStatus).map(s => (
            <button
              key={s.value}
              onClick={() => changeStatus(s.value)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition ${s.color}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
