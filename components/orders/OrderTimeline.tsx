'use client'

import { useState } from 'react'
import { STATUS_LABEL } from '@/lib/orders/constants'

type HistoryEntry = {
  id: string
  old_business_status?: string | null
  new_business_status?: string | null
  changed_by_source: string
  reason?: string | null
  created_at: string
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })
}

function formatDay(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'TODAY'
  if (d.toDateString() === yesterday.toDateString()) return 'YESTERDAY'
  return d.toLocaleDateString('fr-MA', { dateStyle: 'medium' }).toUpperCase()
}

export default function OrderTimeline({
  orderId,
  history,
  createdAt,
}: {
  orderId: string
  history: HistoryEntry[]
  createdAt: string
}) {
  const [comment, setComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [entries, setEntries] = useState<HistoryEntry[]>(history)

  const handlePost = async () => {
    if (!comment.trim() || posting) return
    setPosting(true)
    const res = await fetch(`/api/orders/${orderId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment }),
    })
    const data = await res.json()
    if (data.ok && data.entry) {
      setEntries(prev => [...prev, data.entry])
    }
    setComment('')
    setPosting(false)
  }

  // Build timeline items: creation + history entries
  const allEntries = [
    { id: 'created', type: 'created', date: createdAt },
    ...entries.map(e => ({ id: e.id, type: 'history', entry: e, date: e.created_at })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Group by day
  const grouped: { day: string; items: typeof allEntries }[] = []
  allEntries.forEach(item => {
    const day = formatDay(item.date)
    const last = grouped[grouped.length - 1]
    if (last && last.day === day) {
      last.items.push(item)
    } else {
      grouped.push({ day, items: [item] })
    }
  })

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h2 className="font-semibold text-sm text-gray-900 mb-4">Timeline</h2>

      {/* Comment box */}
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Leave a comment..."
          rows={2}
          className="w-full px-4 py-3 text-sm text-gray-700 placeholder-gray-300 resize-none focus:outline-none"
        />
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-100">
          <span className="text-xs text-gray-400">Only you and other staff can see comments</span>
          <button
            onClick={handlePost}
            disabled={!comment.trim() || posting}
            className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-40"
          >
            {posting ? '...' : 'Post'}
          </button>
        </div>
      </div>

      {/* Timeline entries */}
      <div className="space-y-4">
        {grouped.map(group => (
          <div key={group.day}>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 text-center">
              {group.day}
            </div>
            <div className="space-y-2.5">
              {group.items.map(item => {
                if (item.type === 'created') {
                  return (
                    <div key="created" className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-sm text-gray-600">You created this order.</span>
                        <span className="text-xs text-gray-400 ml-3 shrink-0">{formatTime(item.date)}</span>
                      </div>
                    </div>
                  )
                }

                const e = (item as any).entry as HistoryEntry

                if (e.changed_by_source === 'comment') {
                  return (
                    <div key={e.id} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm text-gray-700 bg-blue-50 rounded-lg px-3 py-2">{e.reason}</div>
                        <div className="text-xs text-gray-400 mt-1">{formatTime(e.created_at)}</div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={e.id} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {e.old_business_status && (
                          <span className="text-gray-400">
                            {STATUS_LABEL[e.old_business_status] || e.old_business_status}
                            {' → '}
                          </span>
                        )}
                        <span className="font-medium text-gray-800">
                          {STATUS_LABEL[e.new_business_status || ''] || e.new_business_status}
                        </span>
                        {e.reason && e.changed_by_source !== 'comment' && (
                          <span className="text-gray-400 ml-1">— {e.reason}</span>
                        )}
                      </span>
                      <span className="text-xs text-gray-400 ml-3 shrink-0">{formatTime(e.created_at)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
