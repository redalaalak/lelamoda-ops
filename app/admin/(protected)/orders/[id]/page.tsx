import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import OrderActions from '@/components/orders/OrderActions'
import OrderTimeline from '@/components/orders/OrderTimeline'
import OrderPipeline from '@/components/orders/OrderPipeline'
import OrderStatusBadge from '@/components/orders/OrderStatusBadge'
import EditOrderPanel from '@/components/orders/EditOrderPanel'
import CustomerCard from '@/components/orders/CustomerCard'
import { OrderStatusProvider } from '@/components/orders/OrderStatusContext'
import { STATUS_COLOR, STATUS_LABEL } from '@/lib/orders/constants'
import WhatsAppButton from '@/components/orders/WhatsAppButton'

export const dynamic = 'force-dynamic'

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!order) notFound()

  const [
    { data: items },
    eventsResult,
  ] = await Promise.all([
    supabaseAdmin.from('order_items').select('*').eq('order_id', params.id),
    supabaseAdmin
      .from('order_events')
      .select('id, order_id, event_type, title, description, actor_name, actor_user_id, source, metadata, created_at')
      .eq('order_id', params.id)
      .order('created_at', { ascending: true }),
  ])

  // order_events table may not exist yet — fail gracefully
  const events = eventsResult.error ? [] : (eventsResult.data || [])

  // Load linked customer profile
  const { data: linkedCustomer } = order.customer_id
    ? await supabaseAdmin.from('customers').select('*').eq('id', order.customer_id).single()
    : { data: null }

  // Customer stats
  let totalOrders    = 1
  let returnedOrders = 0
  let otherOrders: any[] = []

  if (order.customer_id) {
    const [countRes, returnedRes, othersRes] = await Promise.all([
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).eq('customer_id', order.customer_id),
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).eq('customer_id', order.customer_id).eq('business_status', 'returned'),
      supabaseAdmin.from('orders').select('id, shopify_order_name, total_price, business_status, created_at, order_items(title, image_url)').eq('customer_id', order.customer_id).neq('id', params.id).order('created_at', { ascending: false }).limit(3),
    ])
    totalOrders    = countRes.count    ?? 1
    returnedOrders = returnedRes.count ?? 0
    otherOrders    = othersRes.data    ?? []
  }

  return (
    <OrderStatusProvider
      orderId={order.id}
      initialStatus={order.business_status}
      initialPaymentStatus={order.payment_status}
    >
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="text-gray-400 hover:text-gray-600">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-gray-900">
            {order.shopify_order_name || `#${order.shopify_order_number}`}
          </h1>
          <OrderStatusBadge />
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition flex items-center gap-1.5">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <WhatsAppButton
            orderId={order.id}
            phone={order.customer_phone ?? order.shipping_phone ?? null}
            orderName={order.shopify_order_name || ''}
            customerName={order.customer_full_name || ''}
          />
          <OrderActions orderId={order.id} />
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

          {/* Products + Pricing — editable */}
          <EditOrderPanel
            orderId={order.id}
            initialItems={(items || []).map((item: any) => ({
              id:                 item.id,
              shopify_product_id: item.shopify_product_id ?? null,
              shopify_variant_id: item.shopify_variant_id ?? null,
              sku:                item.sku ?? null,
              title:              item.title ?? '',
              variant_title:      item.variant_title ?? null,
              quantity:           item.quantity ?? 1,
              unit_price:         Number(item.unit_price ?? 0),
              image_url:          item.image_url ?? null,
              is_custom:          item.is_custom ?? false,
            }))}
            initialShipping={Number(order.shipping_price ?? 0)}
            initialDiscount={Number(order.discount_total ?? 0)}
          />

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
                {order.payment_status === 'paid' ? 'Paid' : 'COD — Not Yet Paid'}
              </span>
            </div>
            <div className="text-sm text-gray-500 mb-1">{order.payment_method || 'Cash on Delivery'}</div>
            <div className="text-sm text-gray-400">No transactions recorded.</div>
          </div>

          {/* Pipeline */}
          <OrderPipeline orderId={order.id} />

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
          <OrderTimeline orderId={order.id} events={events || []} createdAt={order.created_at} />

        </div>

        {/* ── RIGHT COLUMN ────────────────────────────── */}
        <div className="space-y-4">

          {/* Customer card — EGROW-style with full edit capability */}
          <CustomerCard
            orderId={order.id}
            customer={linkedCustomer ?? null}
            orderCustomerName={order.customer_full_name ?? null}
            orderCustomerPhone={order.customer_phone ?? null}
            orderCustomerEmail={order.customer_email ?? null}
            shipping={{
              first_name:   order.shipping_first_name   ?? null,
              last_name:    order.shipping_last_name    ?? null,
              phone:        order.shipping_phone        ?? null,
              address1:     order.shipping_address1     ?? null,
              address2:     order.shipping_address2     ?? null,
              city:         order.shipping_city         ?? null,
              province:     order.shipping_province     ?? null,
              zip:          order.shipping_zip          ?? null,
              country_code: order.shipping_country_code ?? null,
            }}
            totalOrders={totalOrders}
            returnedOrders={returnedOrders}
          />

          {/* Orders History */}
          {otherOrders.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Orders History</div>
              <div className="space-y-3">
                {otherOrders.map((o: any) => (
                  <Link
                    key={o.id}
                    href={`/admin/orders/${o.id}`}
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
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_COLOR[o.business_status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[o.business_status] || o.business_status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Payment Status — clearly separated from business stage */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Payment</div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Payment status</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  order.payment_status === 'paid'
                    ? 'bg-emerald-100 text-emerald-700'
                    : order.payment_status === 'refunded'
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {order.payment_status === 'paid' ? 'Paid' : order.payment_status === 'refunded' ? 'Refunded' : 'COD — Not Yet Paid'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Method</span>
                <span className="text-xs text-gray-700 font-medium">{order.payment_method || 'Cash on Delivery'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Amount due</span>
                <span className="text-xs font-semibold text-gray-900">MAD {Number(order.amount_due || order.total_price || 0).toFixed(2)}</span>
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
    </OrderStatusProvider>
  )
}
