'use client'

import { useState, useRef, useEffect } from 'react'
import { BUSINESS_STATUS_LIST } from '@/lib/orders/constants'
import { useOrderStatus } from './OrderStatusContext'

export default function OrderActions({ orderId }: { orderId: string }) {
  const { status, setStatus } = useOrderStatus()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const changeStatus = async (newStatus: string) => {
    if (newStatus === status) { setOpen(false); return }
    setOpen(false)
    const prev = status
    setStatus(newStatus) // optimistic
    setSaving(true)
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) setStatus(prev) // revert on error
    setSaving(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={saving}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition disabled:opacity-60"
      >
        {saving ? (
          <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <>
            Move status
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
          {BUSINESS_STATUS_LIST.filter(s => s.value !== status).map(s => (
            <button
              key={s.value}
              onClick={() => changeStatus(s.value)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition flex items-center gap-2"
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
              <span className="text-gray-700">{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
