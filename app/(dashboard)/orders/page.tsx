import { supabaseAdmin } from '@/lib/supabase/admin'
import OrdersTable from '@/components/orders/OrdersTable'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OrdersPage() {
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-xs text-slate-400 mt-0.5">Live — updates automatically</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          <span className="text-sm text-slate-500">{orders?.length || 0} orders</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          Error: {error.message}
        </div>
      )}

      <OrdersTable initialOrders={orders || []} />
    </div>
  )
}
