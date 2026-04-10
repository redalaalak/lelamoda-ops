'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { STATUS_COLOR, STATUS_LABEL } from '@/lib/orders/constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function OrdersTable({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')

  // Get unique cities for filter
  const cities = Array.from(new Set(orders.map(o => o.shipping_city).filter(Boolean))).sort()

  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const newOrder = payload.new as Order
        setOrders((prev) => [newOrder, ...prev])
        setNewOrderIds((prev) => new Set(prev).add(newOrder.id))
        setTimeout(() => {
          setNewOrderIds((prev) => { const n = new Set(prev); n.delete(newOrder.id); return n })
        }, 8000)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const updated = payload.new as Order
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

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

  return (
    <div className="bg-white rounded-xl border border-gray-100">
      {/* Filters */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
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

          {/* Payment Type */}
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-gray-500"
          >
            <option value="">All Payment Types</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>

          {/* Global Stage */}
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

          {/* City / Pipeline */}
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

          {/* Reset */}
          {(search || statusFilter || paymentFilter || cityFilter) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setPaymentFilter(''); setCityFilter('') }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 hover:bg-gray-100 rounded-lg transition"
            >
              Reset
            </button>
          )}

          <span className="text-xs text-gray-400 ml-auto">{filtered.length} orders</span>
        </div>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
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
              <td colSpan={7} className="text-center py-16 text-gray-400 text-sm">
                <div className="flex flex-col items-center gap-2">
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} className="text-gray-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <span>No orders found</span>
                  <span className="flex items-center gap-1 text-xs text-emerald-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live connection active
                  </span>
                </div>
              </td>
            </tr>
          ) : (
            filtered.map((order) => (
              <tr
                key={order.id}
                onClick={() => window.location.href = `/orders/${order.id}`}
                className={`border-b border-gray-50 cursor-pointer transition-colors ${
                  newOrderIds.has(order.id) ? 'bg-emerald-50' : 'hover:bg-gray-50'
                }`}
              >
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
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
