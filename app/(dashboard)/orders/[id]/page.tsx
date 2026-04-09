import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

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
}

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!order) notFound()

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('*')
    .eq('order_id', params.id)

  const { data: history } = await supabaseAdmin
    .from('order_status_history')
    .select('*')
    .eq('order_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/orders" className="text-slate-400 hover:text-slate-600 text-sm">
          ← Orders
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-bold text-slate-900">
          {order.shopify_order_name || `#${order.shopify_order_number}`}
        </h1>
        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${statusColors[order.business_status] || 'bg-slate-100 text-slate-600'}`}>
          {order.business_status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-5">

        {/* Left column */}
        <div className="col-span-2 space-y-5">

          {/* Order Items */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Products</h2>
            <div className="space-y-3">
              {items && items.length > 0 ? items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="font-medium text-sm text-slate-900">{item.title}</div>
                    {item.variant_title && (
                      <div className="text-xs text-slate-400 mt-0.5">{item.variant_title}</div>
                    )}
                    {item.sku && <div className="text-xs text-slate-400">SKU: {item.sku}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900">MAD {Number(item.unit_price).toFixed(0)}</div>
                    <div className="text-xs text-slate-400">x{item.quantity}</div>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-slate-400">No items</div>
              )}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>MAD {Number(order.subtotal_price).toFixed(0)}</span>
              </div>
              {Number(order.discount_total) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>- MAD {Number(order.discount_total).toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-slate-600">
                <span>Shipping</span>
                <span>MAD {Number(order.shipping_price).toFixed(0)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total</span>
                <span>MAD {Number(order.total_price).toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Shipping Address</h2>
            <div className="text-sm text-slate-600 space-y-1">
              <div className="font-medium text-slate-900">
                {order.shipping_first_name} {order.shipping_last_name}
              </div>
              {order.shipping_phone && <div>📞 {order.shipping_phone}</div>}
              {order.shipping_address1 && <div>{order.shipping_address1}</div>}
              {order.shipping_address2 && <div>{order.shipping_address2}</div>}
              <div>
                {[order.shipping_city, order.shipping_province, order.shipping_zip].filter(Boolean).join(', ')}
              </div>
              {order.shipping_country_code && <div>{order.shipping_country_code}</div>}
            </div>
          </div>

          {/* Status History */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">History</h2>
            <div className="space-y-3">
              {history && history.map((h) => (
                <div key={h.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-teal-400 mt-1.5 shrink-0"></div>
                  <div>
                    <div className="text-sm text-slate-700">
                      {h.old_business_status && (
                        <span className="text-slate-400">{h.old_business_status} → </span>
                      )}
                      <span className="font-medium">{h.new_business_status}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {h.changed_by_source} — {new Date(h.created_at).toLocaleString('fr-MA')}
                    </div>
                    {h.reason && <div className="text-xs text-slate-400">{h.reason}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Customer */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Customer</h2>
            <div className="text-sm space-y-2">
              <div className="font-medium text-slate-900">{order.customer_full_name}</div>
              {order.customer_phone && (
                <div className="text-slate-600">📞 {order.customer_phone}</div>
              )}
              {order.customer_email && (
                <div className="text-slate-400 text-xs">{order.customer_email}</div>
              )}
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Order Info</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment</span>
                <span className="font-medium text-slate-900">{order.payment_method || 'COD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment status</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {order.payment_status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stock</span>
                <span className="text-slate-700">{order.stock_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shipping</span>
                <span className="text-slate-700">{order.shipping_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date</span>
                <span className="text-slate-700">{new Date(order.created_at).toLocaleDateString('fr-MA')}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Actions</h2>
            <div className="space-y-2">
              {order.business_status === 'pending_confirmation' && (
                <>
                  <form action="/api/orders/confirm" method="POST">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="status" value="confirmed" />
                    <input type="hidden" name="redirect" value={`/orders/${order.id}`} />
                    <button className="w-full px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition">
                      ✅ Confirm
                    </button>
                  </form>
                  <form action="/api/orders/confirm" method="POST">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="status" value="to_edit" />
                    <input type="hidden" name="redirect" value={`/orders/${order.id}`} />
                    <button className="w-full px-4 py-2 bg-orange-100 text-orange-700 text-sm font-medium rounded-xl hover:bg-orange-200 transition">
                      ✏️ To Edit
                    </button>
                  </form>
                  <form action="/api/orders/confirm" method="POST">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="status" value="canceled_confirmation" />
                    <input type="hidden" name="redirect" value={`/orders/${order.id}`} />
                    <button className="w-full px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-xl hover:bg-red-200 transition">
                      ❌ Cancel
                    </button>
                  </form>
                </>
              )}
              {order.business_status !== 'pending_confirmation' && (
                <div className="text-sm text-slate-400 text-center py-2">
                  Status: {order.business_status}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
