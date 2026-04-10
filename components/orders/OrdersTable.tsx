'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { STATUS_COLOR, STATUS_LABEL, BUSINESS_STATUS_LIST } from '@/lib/orders/constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── Types ────────────────────────────────────────────────────────────────────

type Order = {
  id: string
  shopify_order_name: string
  shopify_order_number: string
  customer_full_name: string
  customer_phone: string
  shipping_city: string
  shipping_address1: string
  total_price: number
  business_status: string
  payment_status: string
  payment_method: string
  created_at: string
  first_item_image?: string | null
  first_item_title?: string | null
  first_item_variant?: string | null
  items_count?: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

// ─── Master Checkbox (supports indeterminate) ─────────────────────────────────

function MasterCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean
  indeterminate: boolean
  onChange: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      onClick={e => e.stopPropagation()}
      className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-400 cursor-pointer accent-emerald-500"
    />
  )
}

// ─── Bulk Action Bar ──────────────────────────────────────────────────────────

function BulkActionBar({
  count,
  selectedIds,
  onClear,
}: {
  count: number
  selectedIds: string[]
  onClear: () => void
}) {
  const [stageOpen, setStageOpen] = useState(false)
  const [moving, setMoving] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (stageRef.current && !stageRef.current.contains(e.target as Node)) setStageOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const bulkMoveStatus = async (newStatus: string) => {
    if (moving) return
    setStageOpen(false)
    setMoving(true)
    // Future: call /api/orders/bulk/status with { orderIds: selectedIds, status: newStatus }
    await Promise.all(
      selectedIds.map(id =>
        fetch(`/api/orders/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
      )
    )
    setMoving(false)
    onClear()
    window.location.reload()
  }

  const exportSelected = () => {
    // Future: call /api/orders/export?ids=...
    window.open(`/api/orders/export?ids=${selectedIds.join(',')}`, '_blank')
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 animate-in slide-in-from-top-1 duration-150">
      {/* Count */}
      <div className="flex items-center gap-2 mr-2">
        <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center">
          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-emerald-700">{count} Selected</span>
      </div>

      <div className="w-px h-4 bg-emerald-200 mx-1" />

      {/* Change Stage */}
      <div className="relative" ref={stageRef}>
        <button
          onClick={() => setStageOpen(!stageOpen)}
          disabled={moving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
        >
          {moving ? (
            <svg className="animate-spin" width="12" height="12" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          )}
          Change Stage
          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {stageOpen && (
          <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
            <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-50">
              Move {count} orders to
            </div>
            {BUSINESS_STATUS_LIST.map(s => (
              <button
                key={s.value}
                onClick={() => bulkMoveStatus(s.value)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition flex items-center gap-2"
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                <span className="text-gray-700">{s.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Send to Shipping */}
      <button
        onClick={() => bulkMoveStatus('shipped')}
        disabled={moving}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
      >
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        Send to Shipping
      </button>

      {/* Export Selected */}
      <button
        onClick={exportSelected}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition"
      >
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
      </button>

      {/* Assign — stub for future */}
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed opacity-60"
        title="Coming soon"
        disabled
      >
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Assign
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Clear */}
      <button
        onClick={onClear}
        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition"
      >
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Clear selection
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrdersTable({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set())

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')

  // ── Selection state ──────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Selection helpers
  const toggleOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    const visibleIds = filtered.map(o => o.id)
    const allSelected = visibleIds.every(id => selectedIds.has(id))
    if (allSelected) {
      // Deselect all visible
      setSelectedIds(prev => {
        const next = new Set(prev)
        visibleIds.forEach(id => next.delete(id))
        return next
      })
    } else {
      // Select all visible
      setSelectedIds(prev => {
        const next = new Set(prev)
        visibleIds.forEach(id => next.add(id))
        return next
      })
    }
  }

  const clearSelection = () => setSelectedIds(new Set())
  const isSelected = (id: string) => selectedIds.has(id)
  // ─────────────────────────────────────────────────────────────────────────────

  const cities = Array.from(new Set(orders.map(o => o.shipping_city).filter(Boolean))).sort()

  // Supabase realtime
  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const newOrder = payload.new as Order
        setOrders(prev => [newOrder, ...prev])
        setNewOrderIds(prev => new Set(prev).add(newOrder.id))
        setTimeout(() => {
          setNewOrderIds(prev => { const n = new Set(prev); n.delete(newOrder.id); return n })
        }, 8000)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const updated = payload.new as Order
        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Clear selection when filters change
  useEffect(() => { clearSelection() }, [search, statusFilter, paymentFilter, cityFilter])

  const filtered = orders.filter(o => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      o.customer_full_name?.toLowerCase().includes(q) ||
      o.shopify_order_name?.toLowerCase().includes(q) ||
      o.customer_phone?.includes(q) ||
      o.shipping_city?.toLowerCase().includes(q)
    const matchStatus = !statusFilter || o.business_status === statusFilter
    const matchPayment = !paymentFilter || o.payment_status === paymentFilter
    const matchCity = !cityFilter || o.shipping_city === cityFilter
    return matchSearch && matchStatus && matchPayment && matchCity
  })

  // Master checkbox state
  const visibleIds = filtered.map(o => o.id)
  const selectedCount = visibleIds.filter(id => selectedIds.has(id)).length
  const allSelected = visibleIds.length > 0 && selectedCount === visibleIds.length
  const someSelected = selectedCount > 0 && selectedCount < visibleIds.length
  const totalSelected = selectedIds.size

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">

      {/* ── Filters bar ──────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <svg className="absolute left-3 top-2.5 text-gray-400" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-gray-50"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-gray-500"
          >
            <option value="">All Payment Types</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-gray-500"
          >
            <option value="">Global Stage</option>
            <option value="pending_confirmation">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="to_edit">To Edit</option>
            <option value="canceled_confirmation">Canceled</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="returned">Returned</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <select
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-gray-500"
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          {(search || statusFilter || paymentFilter || cityFilter) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setPaymentFilter(''); setCityFilter('') }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 hover:bg-gray-100 rounded-lg transition"
            >
              Reset
            </button>
          )}

          {/* Count / selected badge */}
          <div className="flex items-center gap-2 ml-auto">
            {totalSelected > 0 && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                {totalSelected} Selected
              </span>
            )}
            <span className="text-xs text-gray-400">{filtered.length} orders</span>
          </div>
        </div>
      </div>

      {/* ── Bulk action bar (visible when ≥1 selected) ───────────────────────── */}
      {totalSelected > 0 && (
        <BulkActionBar
          count={totalSelected}
          selectedIds={Array.from(selectedIds)}
          onClear={clearSelection}
        />
      )}

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            {/* Master checkbox */}
            <th className="pl-4 pr-2 py-3 w-10">
              <MasterCheckbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={toggleAll}
              />
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Order</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Date</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Customer</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Address</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Payment</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Amount</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-16 text-gray-400 text-sm">
                <div className="flex flex-col items-center gap-2">
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} className="text-gray-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <span>No orders found</span>
                  <span className="flex items-center gap-1 text-xs text-emerald-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live connection active
                  </span>
                </div>
              </td>
            </tr>
          ) : (
            filtered.map(order => {
              const selected = isSelected(order.id)
              return (
                <tr
                  key={order.id}
                  className={`border-b border-gray-50 cursor-pointer transition-colors group ${
                    selected
                      ? 'bg-emerald-50/60 hover:bg-emerald-50'
                      : newOrderIds.has(order.id)
                      ? 'bg-emerald-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => { window.location.href = `/orders/${order.id}` }}
                >
                  {/* Row checkbox — stops propagation so click doesn't navigate */}
                  <td className="pl-4 pr-2 py-3 w-10" onClick={e => toggleOne(order.id, e)}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {}}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-400 cursor-pointer accent-emerald-500"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {order.first_item_image ? (
                        <img src={order.first_item_image} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-300 text-base">📦</div>
                      )}
                      <div>
                        <div className="font-semibold text-sm text-gray-900">
                          {order.shopify_order_name || `#${order.shopify_order_number}`}
                        </div>
                        {order.first_item_title && (
                          <div className="text-xs text-gray-400 truncate max-w-[120px]">{order.first_item_title}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {timeAgo(order.created_at)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{order.customer_full_name}</div>
                    <div className="text-xs text-gray-400">{order.customer_phone}</div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-700">{order.shipping_city || '—'}</div>
                    {order.shipping_address1 && (
                      <div className="text-xs text-gray-400 truncate max-w-[140px]">{order.shipping_address1}</div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${
                      order.payment_status === 'paid'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLOR[order.business_status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[order.business_status] || order.business_status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      MAD {Number(order.total_price).toFixed(0)}
                    </span>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
