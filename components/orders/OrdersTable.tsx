'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const statusColors: Record<string, string> = {
  pending_confirmation: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  to_edit: 'bg-orange-100 text-orange-700',
  canceled_confirmation: 'bg-red-100 text-red-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-violet-100 text-violet-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  returned: 'bg-gray-100 text-gray-700',
  blocked_customer: 'bg-red-200 text-red-800',
  out_of_stock: 'bg-yellow-100 text-yellow-700',
}

const statusLabels: Record<string, string> = {
  pending_confirmation: 'Pending',
  confirmed: 'Confirmed',
  to_edit: 'To Edit',
  canceled_confirmation: 'Canceled',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  returned: 'Returned',
  blocked_customer: 'Blocked',
  out_of_stock: 'Out of Stock',
}

type Order = {
  id: string
  shopify_order_name: string
  shopify_order_number: string
  customer_full_name: string
  customer_phone: string
  shipping_city: string
  total_price: number
  business_status: string
  payment_method: string
  created_at: string
}

export default function OrdersTable({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new as Order
          setOrders((prev) => [newOrder, ...prev])
          setNewOrderIds((prev) => new Set(prev).add(newOrder.id))

          // Remove highlight after 4 seconds
          setTimeout(() => {
            setNewOrderIds((prev) => {
              const next = new Set(prev)
              next.delete(newOrder.id)
              return next
            })
          }, 8000)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updated = payload.new as Order
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? updated : o))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Order</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Customer</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">City</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Amount</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-16 text-slate-400 text-sm">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">📦</span>
                  <span>No orders yet — waiting for Shopify...</span>
                  <span className="flex items-center gap-1 text-xs text-green-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                    Live connection active
                  </span>
                </div>
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr
                key={order.id}
                onClick={() => window.location.href = `/orders/${order.id}`}
                className={`border-b border-slate-100 transition-colors duration-500 cursor-pointer ${
                  newOrderIds.has(order.id)
                    ? 'bg-teal-50 border-l-4 border-l-teal-400'
                    : 'hover:bg-slate-50'
                }`}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-sm text-teal-700">
                    {order.shopify_order_name || `#${order.shopify_order_number}`}
                  </div>
                  <div className="text-xs text-slate-400">{order.payment_method}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-slate-900">{order.customer_full_name}</div>
                  <div className="text-xs text-slate-400">{order.customer_phone}</div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{order.shipping_city || '—'}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                  MAD {Number(order.total_price).toFixed(0)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-xs font-medium ${statusColors[order.business_status] || 'bg-slate-100 text-slate-600'}`}>
                    {statusLabels[order.business_status] || order.business_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {new Date(order.created_at).toLocaleDateString('fr-MA')}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
