import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, total_price, business_status, payment_status, created_at')

  const total = orders?.length || 0
  const revenue = orders?.reduce((sum, o) => sum + Number(o.total_price || 0), 0) || 0
  const pending = orders?.filter(o => o.business_status === 'pending_confirmation').length || 0
  const confirmed = orders?.filter(o => o.business_status === 'confirmed').length || 0
  const shipped = orders?.filter(o => o.business_status === 'shipped').length || 0
  const delivered = orders?.filter(o => o.business_status === 'delivered').length || 0
  const canceled = orders?.filter(o => o.business_status === 'canceled_confirmation').length || 0
  const returned = orders?.filter(o => o.business_status === 'returned').length || 0

  // Today's orders
  const today = new Date(); today.setHours(0,0,0,0)
  const todayOrders = orders?.filter(o => new Date(o.created_at) >= today) || []
  const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Welcome to LelaModa OPS</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-gray-900">MAD {revenue.toFixed(0)}</div>
          <div className="text-xs text-emerald-500 mt-1">+{todayRevenue.toFixed(0)} today</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 mb-1">Total Orders</div>
          <div className="text-2xl font-bold text-gray-900">{total}</div>
          <div className="text-xs text-emerald-500 mt-1">+{todayOrders.length} today</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 mb-1">Pending Confirmation</div>
          <div className="text-2xl font-bold text-amber-600">{pending}</div>
          <div className="text-xs text-gray-400 mt-1">Need action</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 mb-1">Delivered</div>
          <div className="text-2xl font-bold text-emerald-600">{delivered}</div>
          <div className="text-xs text-gray-400 mt-1">Successfully delivered</div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <div className="text-sm font-semibold text-gray-700 mb-4">Order Pipeline</div>
        <div className="grid grid-cols-6 gap-3">
          {[
            { label: 'Pending', value: pending, color: 'bg-amber-100 text-amber-700' },
            { label: 'Confirmed', value: confirmed, color: 'bg-blue-100 text-blue-700' },
            { label: 'Shipped', value: shipped, color: 'bg-violet-100 text-violet-700' },
            { label: 'Delivered', value: delivered, color: 'bg-emerald-100 text-emerald-700' },
            { label: 'Canceled', value: canceled, color: 'bg-red-100 text-red-700' },
            { label: 'Returned', value: returned, color: 'bg-gray-100 text-gray-600' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className={`text-2xl font-bold px-3 py-2 rounded-lg ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-1.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Centers shortcuts */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="text-sm font-semibold text-gray-700 mb-4">Quick Access</div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Confirmation', href: '/centers/confirmation', count: pending, color: 'border-amber-200 bg-amber-50 text-amber-700' },
            { label: 'Processing', href: '/centers/processing', count: confirmed, color: 'border-blue-200 bg-blue-50 text-blue-700' },
            { label: 'Shipping', href: '/centers/shipping', count: shipped, color: 'border-violet-200 bg-violet-50 text-violet-700' },
          ].map((c) => (
            <a key={c.href} href={c.href} className={`flex items-center justify-between px-4 py-3 rounded-lg border ${c.color} hover:opacity-80 transition`}>
              <span className="text-sm font-medium">{c.label}</span>
              <span className="text-lg font-bold">{c.count}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
