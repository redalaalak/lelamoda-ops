import { supabaseAdmin } from '@/lib/supabase/admin'
import OrdersTable from '@/components/orders/OrdersTable'
import ImportExportButtons from '@/components/orders/ImportExportButtons'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OrdersPage() {
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(title, image_url, variant_title)')
    .order('created_at', { ascending: false })
    .limit(200)

  // Flatten first item info into each order
  const enriched = (orders || []).map((o: any) => ({
    ...o,
    first_item_image: o.order_items?.[0]?.image_url || null,
    first_item_title: o.order_items?.[0]?.title || null,
    first_item_variant: o.order_items?.[0]?.variant_title || null,
    items_count: o.order_items?.length || 0,
  }))

  const total = enriched.length
  const paid = enriched.filter(o => o.payment_status === 'paid').length
  const pending = enriched.filter(o => o.payment_status === 'pending').length
  const refunded = enriched.filter(o => o.business_status === 'returned').length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-semibold text-gray-900">Orders</h1>
        <div className="flex items-center gap-3">
          <ImportExportButtons />
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs text-gray-400">Live</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-xs text-gray-400">Total Orders</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{paid}</div>
            <div className="text-xs text-gray-400">Paid</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{pending}</div>
            <div className="text-xs text-gray-400">Pending</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{refunded}</div>
            <div className="text-xs text-gray-400">Returned</div>
          </div>
        </div>
      </div>

      <OrdersTable initialOrders={enriched} />
    </div>
  )
}
