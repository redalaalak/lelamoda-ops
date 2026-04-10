import { supabaseAdmin } from '@/lib/supabase/admin'
import OrdersTable from '@/components/orders/OrdersTable'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OrdersPage() {
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  const total = orders?.length || 0
  const paid = orders?.filter(o => o.payment_status === 'paid').length || 0
  const pending = orders?.filter(o => o.payment_status === 'pending').length || 0
  const refunded = orders?.filter(o => o.business_status === 'returned').length || 0

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-semibold text-gray-900">Orders</h1>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs text-gray-400">Live</span>
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

      {/* Table */}
      <OrdersTable initialOrders={orders || []} />
    </div>
  )
}
