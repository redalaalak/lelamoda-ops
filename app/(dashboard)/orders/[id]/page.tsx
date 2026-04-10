import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import OrderActions from '@/components/orders/OrderActions'
import OrderTimeline from '@/components/orders/OrderTimeline'
import OrderPipeline from '@/components/orders/OrderPipeline'

export const dynamic = 'force-dynamic'

const statusColors: Record<string, string> = {
  pending_confirmation: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  to_edit: 'bg-orange-100 text-orange-700',
  canceled_confirmation: 'bg-red-100 text-red-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-violet-100 text-violet-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  returned: 'bg-gray-100 text-gray-600',
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

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!order) notFound()

  const [
    { data: items },
    { data: history },
  ] = await Promise.all([
    supabaseAdmin.from('order_items').select('*').eq('order_id', params.id),
    supabaseAdmin.from('order_status_history').select('*').eq('order_id', params.id).order('created_at', { ascending: true }),
  ])

  // Customer stats
  let totalOrders = 1
  let returnedOrders = 0
  let otherOrders: any[] = []

  if (order.customer_id) {
    const [countRes, returnedRes, othersRes] = await Promise.all([
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).eq('customer_id', order.customer_id),
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).eq('customer_id', order.customer_id).eq('business_status', 'returned'),
      supabaseAdmin.from('orders').select('id, shopify_order_name, total_price, business_status, created_at, order_items(title, image_url)').eq('customer_id', order.customer_id).neq('id', params.id).order('created_at', { ascending: false }).limit(3),
    ])
    totalOrders = countRes.count ?? 1
    returnedOrders = returnedRes.count ?? 0
    otherOrders = othersRes.data ?? []
  }

  const whatsappNumber = (order.customer_phone || '').replace(/[^0-9]/g, '')

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <Link href="/orders" className="text-gray-400 hover:text-gray-600">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-gray-900">
            {order.shopify_order_name || `#${order.shopify_order_number}`}
          </h1>
          <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${statusColors[order.business_status] || 'bg-gray-100 text-gray-600'}`}>
            {statusLabels[order.business_status] || order.business_status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition flex items-center gap-1.5">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <OrderActions orderId={order.id} currentStatus={order.business_status} />
        </div>
      </div>

      <div className="text-xs text-gray-400 mb-5 flex items-center gap-1.5">
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {new Date(order.created_at).toLocaleString('fr-MA', { dateStyle: 'long', timeStyle: 'short' })}
      </div>

      <div className="grid grid-cols-3 gap-5">

        {/* ── LEFT COLUMN ─────────────────────────────── */}
        <div className="col-span-2 space-y-4">

          {/* Products + Pricing */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            {items && items.length > 0 ? items.map((item: any, idx: number) => (
              <div key={item.id} className={`flex items-center gap-4 ${idx > 0 ? 'pt-4 mt-4 border-t border-gray-50' : ''}`}>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="w-16 h-16 object-cover rounded-lg border border-gray-100 shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-2xl">📦</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900">{item.title}</div>
                  {item.variant_title && (
                    <div className="text-xs text-gray-400 mt-0.5">{item.variant_title}</div>
                  )}
                  {item.sku && <div className="text-xs text-gray-400">SKU: {item.sku}</div>}
                  <div className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold text-sm text-gray-900">
                    MAD{Number((item.unit_price || 0) * (item.quantity || 1)).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">MAD{Number(item.unit_price || 0).toFixed(2)} / unit</div>
                </div>
              </div>
            )) : (
              <div className="text-sm text-gray-400">No items</div>
            )}

            {/* Price breakdown */}
            <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>MAD{Number(order.subtotal_price || 0).toFixed(2)}</span>
              </div>
              {Number(order.discount_total) > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount</span>
                  <span>-MAD{Number(order.discount_total).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span>+MAD{Number(order.shipping_price || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-700 pt-2 border-t border-gray-50">
                <span>Total VAT</span>
                <span>MAD{Number(order.total_price || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900">
                <span>Amount Due</span>
                <span>MAD{Number(order.amount_due || order.total_price || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Upsell suggestions */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-sm text-gray-900 mb-3">Upsell suggestions</h2>
            <div className="text-sm text-gray-400">No upsell suggestions available.</div>
          </div>

          {/* Discounts */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm text-gray-900">Discounts</h2>
              <button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">+ Add Discount</button>
            </div>
            {Number(order.discount_total) > 0 ? (
              <div className="text-sm text-gray-700">MAD{Number(order.discount_total).toFixed(2)} discount applied</div>
            ) : (
              <div className="text-sm text-gray-400">No discounts added.</div>
            )}
          </div>

          {/* Custom Fees */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm text-gray-900">Custom Fees</h2>
              <button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">+ Add Fee</button>
            </div>
            <div className="text-sm text-gray-400">No custom fees applied.</div>
          </div>

          {/* Payment & Transactions */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm text-gray-900">Payment & Transactions</h2>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
              </span>
            </div>
            <div className="text-sm text-gray-500 mb-1">{order.payment_method || 'Cash on Delivery'}</div>
            <div className="text-sm text-gray-400">No transactions recorded.</div>
          </div>

          {/* Pipeline */}
          <OrderPipeline currentStatus={order.business_status} orderId={order.id} />

          {/* Custom Attributes */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm text-gray-900">Custom Attributes</h2>
              <button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Attribute
              </button>
            </div>
            <div className="text-sm text-gray-400">No custom attributes.</div>
          </div>

          {/* Timeline */}
          <OrderTimeline orderId={order.id} history={history || []} createdAt={order.created_at} />

        </div>

        {/* ── RIGHT COLUMN ────────────────────────────── */}
        <div className="space-y-4">

          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm text-gray-900">Customer</h2>
            </div>
            <div className="font-semibold text-sm text-gray-900">{order.customer_full_name}</div>
            {order.customer_email && (
              <div className="text-xs text-gray-400 mt-0.5">{order.customer_email}</div>
            )}
            {order.customer_phone && (
              <div className="text-sm text-gray-600 mt-1 mb-3">{order.customer_phone}</div>
            )}

            {/* Contact buttons */}
            {order.customer_phone && (
              <div className="flex items-center gap-2 mb-4">
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center hover:bg-green-100 transition"
                  title="WhatsApp"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#22c55e">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.104.544 4.078 1.5 5.797L0 24l6.386-1.478A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.866 9.866 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374A9.847 9.847 0 012.118 12C2.118 6.534 6.534 2.118 12 2.118S21.882 6.534 21.882 12 17.466 21.882 12 21.882z"/>
                  </svg>
                </a>
                <a
                  href={`tel:${order.customer_phone}`}
                  className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition"
                  title="Call"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </a>
              </div>
            )}

            {/* Shipping Address */}
            <div className="border-t border-gray-50 pt-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Shipping Address</div>
              <div className="text-sm text-gray-700 space-y-0.5">
                {(order.shipping_first_name || order.shipping_last_name) && (
                  <div>{[order.shipping_first_name, order.shipping_last_name].filter(Boolean).join(' ')}</div>
                )}
                {order.shipping_phone && <div className="text-gray-500">{order.shipping_phone}</div>}
                {order.shipping_address1 && <div>{order.shipping_address1}</div>}
                {order.shipping_address2 && <div>{order.shipping_address2}</div>}
                <div className="text-gray-500">
                  {[order.shipping_city, order.shipping_province].filter(Boolean).join(', ')}
                </div>
                {order.shipping_zip && <div className="text-gray-400 text-xs">{order.shipping_zip}</div>}
                <div className="text-gray-400 text-xs">{order.shipping_country_code || 'MA'}</div>
              </div>
            </div>

            {/* Billing */}
            <div className="border-t border-gray-50 pt-4 mt-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Billing Address</div>
              <div className="text-xs text-gray-400">Same as shipping address</div>
            </div>
          </div>

          {/* Products link */}
          {items && items.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">products link</div>
              {items.map((item: any) => (
                <div key={item.id} className="text-sm text-emerald-600 hover:underline truncate cursor-pointer">{item.title}</div>
              ))}
            </div>
          )}

          {/* Customer Lifetime */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Customer Lifetime</div>
              <button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Review</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{totalOrders}</div>
                <div className="text-xs text-gray-400 mt-0.5">Orders</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{returnedOrders}</div>
                <div className="text-xs text-gray-400 mt-0.5">Returned</div>
              </div>
            </div>
          </div>

          {/* Orders History */}
          {otherOrders.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Orders History</div>
              <div className="space-y-3">
                {otherOrders.map((o: any) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-1 -mx-1 transition"
                  >
                    {o.order_items?.[0]?.image_url ? (
                      <img src={o.order_items[0].image_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900 truncate">
                        {o.order_items?.[0]?.title || o.shopify_order_name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(o.created_at).toLocaleDateString('fr-MA')}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold text-gray-900">MAD{Number(o.total_price).toFixed(0)}</div>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusColors[o.business_status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[o.business_status] || o.business_status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Payment Status */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-gray-900">Payment Status</div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-400 mb-1">Financial Status</div>
                <div className="text-sm text-gray-700 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                  {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Payment Method</div>
                <div className="text-sm text-gray-700 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                  {order.payment_method || 'Cash on Delivery'}
                </div>
              </div>
            </div>
          </div>

          {/* Sales Channel */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-sm font-semibold text-gray-900 mb-3">Sales Channel and Store</div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-400 mb-1">Store</div>
                <div className="text-sm text-gray-700 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">lelamoda</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Sales Channel</div>
                <div className="text-sm text-gray-700 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                  {order.utm_source || 'Shopify'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Currency</div>
                <div className="text-sm text-gray-700 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                  {order.currency_code || 'MAD'} — Dirham
                </div>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-sm font-semibold text-gray-900 mb-3">Delivery</div>
            <div className="flex flex-col items-center justify-center py-5 text-center border border-dashed border-gray-200 rounded-xl mb-3">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-gray-300 mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              <div className="text-xs text-gray-400">No tracking information yet</div>
              <div className="text-xs text-gray-300 mt-0.5">Add tracking to notify your customer</div>
            </div>
            <button className="w-full py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition mb-2">
              + Add Parcel
            </button>
            <button className="w-full py-2 text-sm font-medium border border-amber-200 rounded-lg text-amber-600 hover:bg-amber-50 transition">
              Check Customer
            </button>
          </div>

          {/* Shipping */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-sm font-semibold text-gray-900 mb-3">Shipping</div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Shipping Price</div>
                <div className="text-sm font-medium text-gray-900">MAD{Number(order.shipping_price || 0).toFixed(2)}</div>
              </div>
              <button className="text-gray-300 hover:text-gray-500 p-1">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>

          {/* UTM Parameters */}
          {(order.utm_source || order.utm_medium || order.utm_campaign) && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-sm font-semibold text-gray-900 mb-3">UTM Parameters</div>
              <div className="space-y-2 text-xs">
                {order.utm_medium && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 w-16 shrink-0">Medium</span>
                    <span className="text-gray-700">{order.utm_medium}</span>
                  </div>
                )}
                {order.utm_campaign && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 w-16 shrink-0">Campaign</span>
                    <span className="text-gray-700 break-all">{order.utm_campaign}</span>
                  </div>
                )}
                {order.utm_source && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 w-16 shrink-0">Source</span>
                    <span className="text-gray-700">{order.utm_source}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assign */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-sm font-semibold text-gray-900 mb-3">Assign</div>
            <input
              type="text"
              placeholder="Search and select assignee..."
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400 text-gray-600 bg-gray-50"
            />
          </div>

        </div>
      </div>
    </div>
  )
}
