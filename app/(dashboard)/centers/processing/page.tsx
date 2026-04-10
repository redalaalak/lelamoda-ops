import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'
import OrdersTable from '@/components/orders/OrdersTable'

export const dynamic = 'force-dynamic'

export default async function ProcessingCenterPage() {
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('business_status', 'confirmed')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/centers" className="text-gray-400 hover:text-gray-600 text-sm">Centers</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-semibold text-gray-900">Processing Center</h1>
        <span className="ml-auto text-xs text-gray-400">{orders?.length || 0} orders</span>
      </div>
      <OrdersTable initialOrders={orders || []} />
    </div>
  )
}
