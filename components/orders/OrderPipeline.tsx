'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PIPELINE_STEPS, SIDE_STATUSES, STATUS_LABEL, STATUS_COLOR, BUSINESS_STATUS_LIST } from '@/lib/orders/constants'

export default function OrderPipeline({ currentStatus, orderId }: { currentStatus: string; orderId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const currentIdx = PIPELINE_STEPS.indexOf(currentStatus as any)
  const isInPipeline = currentIdx !== -1

  const changeStatus = async (status: string) => {
    if (status === currentStatus || loading) return
    setLoading(true)
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(false)
    router.refresh()
  }

  const sideList = BUSINESS_STATUS_LIST.filter(s => SIDE_STATUSES.includes(s.value as any))

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h2 className="font-semibold text-sm text-gray-900 mb-4">Pipeline</h2>

      {/* Main pipeline steps */}
      <div className="flex items-center gap-0 mb-4 overflow-x-auto pb-1">
        {PIPELINE_STEPS.map((stepValue, idx) => {
          const isDone = isInPipeline && idx < currentIdx
          const isCurrent = stepValue === currentStatus
          const isNext = isInPipeline && idx === currentIdx + 1

          return (
            <div key={stepValue} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1 min-w-0">
                <button
                  onClick={() => changeStatus(stepValue)}
                  disabled={loading}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition shrink-0 ${
                    isCurrent
                      ? 'bg-emerald-500 text-white shadow-sm ring-4 ring-emerald-100'
                      : isDone
                      ? 'bg-emerald-400 text-white'
                      : isNext
                      ? 'bg-gray-200 text-gray-500 hover:bg-emerald-100 hover:text-emerald-700'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                  title={`Set to ${STATUS_LABEL[stepValue]}`}
                >
                  {isCurrent || isDone ? (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </button>
                <span className={`text-xs mt-1.5 truncate max-w-full px-1 text-center ${isCurrent ? 'text-emerald-600 font-semibold' : isDone ? 'text-emerald-500' : 'text-gray-400'}`}>
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
            disabled={loading}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition disabled:opacity-60 ${s.color} ${
              s.value === currentStatus ? 'ring-2 ring-offset-1 ring-current' : ''
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
