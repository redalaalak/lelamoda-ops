import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const statusColors: Record<string, string> = {
  pending_confirmation: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  to_edit: 'bg-orange-100 text-orange-700',
  canceled_confirmation: 'bg-red-100 text-red-700',
}

export default async function ConfirmationCenterPage({
  searchParams,
}: {
  searchParams: { id?: string }
}) {
  // Get all pending orders
  const { data: pendingOrders } = await supabaseAdmin
    .from('orders')
    .select('id, shopify_order_name, shopify_order_number, customer_full_name, customer_phone, total_price, business_status, created_at')
    .eq('business_status', 'pending_confirmation')
    .order('created_at', { ascending: true })

  const counts = {
    total: pendingOrders?.length || 0,
    pending: pendingOrders?.length || 0,
    confirmed: 0,
    failed: 0,
  }

  // Get confirmed/canceled today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { data: todayHistory } = await supabaseAdmin
    .from('order_status_history')
    .select('new_business_status')
    .gte('created_at', today.toISOString())
    .in('new_business_status', ['confirmed', 'canceled_confirmation', 'to_edit'])

  counts.confirmed = todayHistory?.filter(h => h.new_business_status === 'confirmed').length || 0
  counts.failed = todayHistory?.filter(h => h.new_business_status === 'canceled_confirmation').length || 0

  // Current order — first pending or selected
  const currentId = searchParams.id || pendingOrders?.[0]?.id
  let order = null
  let items = null

  if (currentId) {
    const { data: o } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', currentId)
      .single()
    order = o

    const { data: i } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', currentId)
    items = i
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/centers" className="text-gray-400 hover:text-gray-600 text-sm">Centers</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-semibold text-gray-900">Confirmation Center</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Calls', value: counts.total, color: 'text-blue-600 bg-blue-50' },
          { label: 'Pending', value: counts.pending, color: 'text-amber-600 bg-amber-50' },
          { label: 'Confirmed', value: counts.confirmed, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Failed', value: counts.failed, color: 'text-red-600 bg-red-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`text-2xl font-bold ${s.color.split(' ')[0]}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {!order ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} className="text-gray-200 mx-auto mb-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-gray-400 font-medium">No pending orders</div>
          <div className="text-xs text-gray-300 mt-1">All orders have been processed</div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {/* Left — Order Queue */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Queue ({pendingOrders?.length})</span>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
              {pendingOrders?.map((o) => (
                <Link
                  key={o.id}
                  href={`/centers/confirmation?id=${o.id}`}
                  className={`flex items-center justify-between px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    o.id === currentId ? 'bg-emerald-50 border-l-2 border-l-emerald-400' : ''
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{o.shopify_order_name}</div>
                    <div className="text-xs text-gray-400">{o.customer_full_name}</div>
                  </div>
                  <div className="text-xs font-semibold text-gray-700">MAD {Number(o.total_price).toFixed(0)}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Center — Order Details */}
          <div className="space-y-4">
            {/* Customer */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-semibold text-emerald-700 text-sm">
                  {order.customer_full_name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{order.customer_full_name}</div>
                  <div className="text-xs text-gray-400">{order.customer_phone}</div>
                </div>
                <span className={`ml-auto px-2 py-0.5 rounded-md text-xs font-medium ${statusColors[order.business_status] || 'bg-gray-100 text-gray-600'}`}>
                  {order.business_status}
                </span>
              </div>
              <div className="text-xs text-gray-500 border-t border-gray-50 pt-3 space-y-1">
                {order.shipping_address1 && <div>{order.shipping_address1}</div>}
                <div>{[order.shipping_city, order.shipping_province].filter(Boolean).join(', ')}</div>
              </div>
            </div>

            {/* Products */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Products</div>
              <div className="space-y-3">
                {items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-300 text-lg">📦</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{item.title}</div>
                      {item.variant_title && <div className="text-xs text-gray-400">{item.variant_title}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-gray-900">MAD {Number(item.unit_price).toFixed(0)}</div>
                      <div className="text-xs text-gray-400">x{item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-bold text-gray-900 text-sm">
                <span>Total</span>
                <span>MAD {Number(order.total_price).toFixed(0)}</span>
              </div>
            </div>

            {/* Note */}
            {order.customer_note && (
              <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
                <div className="text-xs font-semibold text-amber-600 mb-1">Customer Note</div>
                <div className="text-sm text-gray-700">{order.customer_note}</div>
              </div>
            )}
          </div>

          {/* Right — Actions */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Actions</div>
              <div className="space-y-2">
                {order.business_status === 'pending_confirmation' && (
                  <>
                    <form action="/api/orders/confirm" method="POST">
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="status" value="confirmed" />
                      <input type="hidden" name="redirect" value="/centers/confirmation" />
                      <button className="w-full px-4 py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 transition flex items-center justify-center gap-2">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Confirm Order
                      </button>
                    </form>
                    <form action="/api/orders/confirm" method="POST">
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="status" value="to_edit" />
                      <input type="hidden" name="redirect" value="/centers/confirmation" />
                      <button className="w-full px-4 py-2.5 bg-orange-50 text-orange-700 text-sm font-semibold rounded-lg hover:bg-orange-100 transition flex items-center justify-center gap-2">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        To Edit
                      </button>
                    </form>
                    <form action="/api/orders/confirm" method="POST">
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="status" value="canceled_confirmation" />
                      <input type="hidden" name="redirect" value="/centers/confirmation" />
                      <button className="w-full px-4 py-2.5 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-2">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>

            {/* WhatsApp */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact</div>
              <div className="space-y-2">
                {order.customer_phone && (
                  <a
                    href={`https://wa.me/${order.customer_phone?.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-4 py-2.5 bg-[#25D366] text-white text-sm font-semibold rounded-lg hover:bg-[#22c55e] transition flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                )}
                <Link
                  href={`/orders/${order.id}`}
                  className="w-full px-4 py-2.5 bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2"
                >
                  View Full Order
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
