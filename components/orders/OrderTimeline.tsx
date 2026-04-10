'use client'

import { useState } from 'react'
import type { OrderEvent } from '@/lib/orders/logEvent'

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })
}

function formatDayLabel(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'TODAY'
  if (d.toDateString() === yesterday.toDateString()) return 'YESTERDAY'
  return d.toLocaleDateString('fr-MA', { dateStyle: 'medium' }).toUpperCase()
}

function dayKey(dateStr: string) {
  return new Date(dateStr).toDateString()
}

// ---------------------------------------------------------------------------
// Actor display tag
// ---------------------------------------------------------------------------
const ACTOR_LABEL: Record<string, string> = {
  system:               'system',
  shopify_webhook:      'Shopify',
  automation:           'automation',
  shipping_integration: 'shipping',
  csv_import:           'CSV import',
  user:                 'user',
}

function ActorTag({ name }: { name: string }) {
  const label = ACTOR_LABEL[name] ?? name
  const isSystem = ['system', 'shopify_webhook', 'automation', 'shipping_integration', 'csv_import', 'shipping'].includes(name)

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ml-1.5 ${
      isSystem
        ? 'bg-gray-100 text-gray-500'
        : 'bg-emerald-50 text-emerald-700'
    }`}>
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Dot color per event type
// ---------------------------------------------------------------------------
function dotColor(eventType: string): string {
  switch (eventType) {
    case 'order_created':
    case 'order_imported':
      return 'bg-emerald-400'
    case 'note_added':
      return 'bg-blue-400'
    case 'business_status_changed':
      return 'bg-violet-400'
    case 'payment_status_changed':
      return 'bg-amber-400'
    case 'tracking_updated':
    case 'parcel_created':
      return 'bg-teal-400'
    case 'stock_status_changed':
    case 'shipping_status_changed':
      return 'bg-sky-400'
    case 'customer_info_updated':
      return 'bg-orange-400'
    default:
      return 'bg-gray-300'
  }
}

// ---------------------------------------------------------------------------
// Single timeline row
// ---------------------------------------------------------------------------
function EventRow({ event }: { event: OrderEvent }) {
  const isNote = event.event_type === 'note_added'

  if (isNote) {
    return (
      <div className="flex items-start gap-3">
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor(event.event_type)} mt-1.5 shrink-0`} />
        <div className="flex-1">
          <div className="text-sm text-gray-700 bg-blue-50 rounded-lg px-3 py-2 leading-relaxed">
            {event.description}
          </div>
          <div className="flex items-center mt-1 gap-1">
            <span className="text-xs text-gray-400">{formatTime(event.created_at)}</span>
            <ActorTag name={event.actor_name} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <div className={`w-1.5 h-1.5 rounded-full ${dotColor(event.event_type)} mt-1.5 shrink-0`} />
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <span className="text-sm text-gray-800 font-medium">{event.title}</span>
            <ActorTag name={event.actor_name} />
            {event.description && (
              <div className="text-xs text-gray-500 mt-0.5">{event.description}</div>
            )}
          </div>
          <span className="text-xs text-gray-400 shrink-0 mt-0.5">{formatTime(event.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function OrderTimeline({
  orderId,
  events,
  createdAt,
}: {
  orderId: string
  events: OrderEvent[]
  createdAt: string
}) {
  const [comment, setComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [localEvents, setLocalEvents] = useState<OrderEvent[]>(events)

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
      setLocalEvents(prev => [...prev, data.entry as OrderEvent])
    }
    setComment('')
    setPosting(false)
  }

  // Synthetic "order created" entry if no events exist yet
  const syntheticCreated: OrderEvent = {
    id: '__created__',
    order_id: orderId,
    event_type: 'order_created',
    title: 'Order created',
    description: null,
    actor_name: 'system',
    actor_user_id: null,
    source: 'system',
    metadata: null,
    created_at: createdAt,
  }

  // Merge: show synthetic "created" only if no imported/created event already exists
  const hasCreationEvent = localEvents.some(
    e => e.event_type === 'order_created' || e.event_type === 'order_imported'
  )
  const allEvents: OrderEvent[] = hasCreationEvent
    ? [...localEvents]
    : [syntheticCreated, ...localEvents]

  allEvents.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // Group by day
  const grouped: { label: string; events: OrderEvent[] }[] = []
  allEvents.forEach(ev => {
    const label = formatDayLabel(ev.created_at)
    const key = dayKey(ev.created_at)
    const last = grouped[grouped.length - 1]
    if (last && dayKey(last.events[0].created_at) === key) {
      last.events.push(ev)
    } else {
      grouped.push({ label, events: [ev] })
    }
  })

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h2 className="font-semibold text-sm text-gray-900 mb-4">Activity Timeline</h2>

      {/* Comment box */}
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-5">
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Leave a comment..."
          rows={2}
          className="w-full px-4 py-3 text-sm text-gray-700 placeholder-gray-300 resize-none focus:outline-none"
        />
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-100">
          <span className="text-xs text-gray-400">Only staff can see comments</span>
          <button
            onClick={handlePost}
            disabled={!comment.trim() || posting}
            className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-40"
          >
            {posting ? '...' : 'Post'}
          </button>
        </div>
      </div>

      {/* Timeline entries grouped by day */}
      {grouped.length === 0 ? (
        <div className="text-xs text-gray-400 text-center py-4">No activity recorded yet.</div>
      ) : (
        <div className="space-y-5">
          {grouped.map(group => (
            <div key={group.label}>
              {/* Day divider */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider shrink-0">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <div className="space-y-3">
                {group.events.map(ev => (
                  <EventRow key={ev.id} event={ev} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
