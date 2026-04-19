import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'
import OrdersTable from '@/components/orders/OrdersTable'

export const dynamic = 'force-dynamic'

export default async function FollowUpCenterPage() {
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(title, image_url, variant_title)')
    .eq('business_status', 'to_edit')
    .order('created_at', { ascending: false })

  const enriched = (orders || []).map((o: any) => ({
    ...o,
    first_item_image: o.order_items?.[0]?.image_url || null,
    first_item_title: o.order_items?.[0]?.title || null,
    first_item_variant: o.order_items?.[0]?.variant_title || null,
    items_count: o.order_items?.length || 0,
  }))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/centers" className="text-gray-400 hover:text-gray-600 transition">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Follow Up Center</h1>
          <span className="text-sm text-gray-400">— {enriched.length} orders</span>
        </div>
      </div>
      <OrdersTable initialOrders={enriched} />
    </div>
  )
}
