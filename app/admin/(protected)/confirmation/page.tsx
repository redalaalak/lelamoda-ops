import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ConfirmationPage() {
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*)')
    .eq('business_status', 'pending_confirmation')
    .order('created_at', { ascending: true })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Confirmation Center</h1>
          <p className="text-sm text-slate-500 mt-1">Orders waiting for confirmation</p>
        </div>
        <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-xl text-sm font-medium">
          {orders?.length || 0} pending
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          Error: {error.message}
        </div>
      )}

      <div className="space-y-4">
        {!orders || orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            No orders pending confirmation.
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-900">
                    {order.shopify_order_name || `#${order.shopify_order_number}`}
                  </div>
                  <div className="text-sm text-slate-600 mt-1">{order.customer_full_name}</div>
                  <div className="text-sm text-slate-500">{order.customer_phone}</div>
                  <div className="text-sm text-slate-500 mt-1">
                    {order.shipping_address1}, {order.shipping_city}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 text-lg">MAD {Number(order.total_price).toFixed(0)}</div>
                  <div className="text-xs text-slate-400 mt-1">{order.payment_method}</div>
                </div>
              </div>

              {order.order_items && order.order_items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  {order.order_items.map((item: any) => (
                    <div key={item.id} className="text-sm text-slate-600 flex justify-between">
                      <span>{item.title} {item.variant_title ? `— ${item.variant_title}` : ''}</span>
                      <span>x{item.quantity} • MAD {item.unit_price}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <form action="/api/orders/confirm" method="POST">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="status" value="confirmed" />
                  <button type="submit" className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition">
                    ✅ Confirm
                  </button>
                </form>
                <form action="/api/orders/confirm" method="POST">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="status" value="to_edit" />
                  <button type="submit" className="px-4 py-2 bg-orange-100 text-orange-700 text-sm font-medium rounded-xl hover:bg-orange-200 transition">
                    ✏️ To Edit
                  </button>
                </form>
                <form action="/api/orders/confirm" method="POST">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="status" value="canceled_confirmation" />
                  <button type="submit" className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-xl hover:bg-red-200 transition">
                    ❌ Cancel
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
