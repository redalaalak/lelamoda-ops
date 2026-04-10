'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PIPELINE_STEPS, SIDE_STATUSES, STATUS_LABEL, BUSINESS_STATUS_LIST } from '@/lib/orders/constants'

export default function OrderPipeline({ currentStatus, orderId }: { currentStatus: string; orderId: string }) {
  // Optimistic local state — updates immediately on click
  const [status, setStatus] = useState(currentStatus)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const currentIdx = PIPELINE_STEPS.indexOf(status as any)
  const isInPipeline = currentIdx !== -1

  const changeStatus = async (newStatus: string) => {
    if (newStatus === status || isPending) return
    setError(null)

    // Optimistic update immediately
    const prevStatus = status
    setStatus(newStatus)

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Revert on error
        setStatus(prevStatus)
        setError(data.error || 'Failed to update status')
        return
      }

      // Sync server component in background
      startTransition(() => {
        router.refresh()
      })
    } catch (e) {
      setStatus(prevStatus)
      setError('Network error')
    }
  }

  const sideList = BUSINESS_STATUS_LIST.filter(s => SIDE_STATUSES.includes(s.value as any))

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm text-gray-900">Pipeline</h2>
        {isPending && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <svg className="animate-spin" width="10" height="10" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving...
          </span>
        )}
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Main pipeline steps */}
      <div className="flex items-center gap-0 mb-4 overflow-x-auto pb-1">
        {PIPELINE_STEPS.map((stepValue, idx) => {
          const isDone = isInPipeline && idx < currentIdx
          const isCurrent = stepValue === status

          return (
            <div key={stepValue} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1 min-w-0">
                <button
                  onClick={() => changeStatus(stepValue)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition shrink-0 ${
                    isCurrent
                      ? 'bg-emerald-500 text-white shadow-sm ring-4 ring-emerald-100'
                      : isDone
                      ? 'bg-emerald-400 text-white cursor-pointer hover:bg-emerald-500'
                      : 'bg-gray-100 text-gray-400 hover:bg-emerald-100 hover:text-emerald-700 cursor-pointer'
                  }`}
                  title={`Move to ${STATUS_LABEL[stepValue]}`}
                >
                  {isCurrent || isDone ? (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </button>
                <span className={`text-xs mt-1.5 truncate max-w-full px-1 text-center ${
                  isCurrent ? 'text-emerald-600 font-semibold' : isDone ? 'text-emerald-500' : 'text-gray-400'
                }`}>
                  {STATUS_LABEL[stepValue]}
                </span>
              </div>
              {idx < PIPELINE_STEPS.length - 1 && (
                <div className={`h-0.5 w-full max-w-[40px] mx-1 shrink-0 ${isDone || isCurrent ? 'bg-emerald-400' : 'bg-gray-100'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Side statuses */}
      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-50">
        {sideList.map(s => (
          <button
            key={s.value}
            onClick={() => changeStatus(s.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${s.color} ${
              s.value === status ? 'ring-2 ring-offset-1 ring-current' : 'opacity-70 hover:opacity-100'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
