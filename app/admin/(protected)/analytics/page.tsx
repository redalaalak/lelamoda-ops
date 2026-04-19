import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, total_price, business_status, payment_status, created_at, shipping_city')

  const all = orders || []
  const total = all.length
  const revenue = all.reduce((s, o) => s + Number(o.total_price || 0), 0)
  const delivered = all.filter(o => o.business_status === 'delivered').length
  const returned = all.filter(o => o.business_status === 'returned').length
  const confirmed = all.filter(o => ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.business_status)).length

  const confirmRate = total > 0 ? Math.round((confirmed / total) * 100) : 0
  const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0
  const returnRate = total > 0 ? Math.round((returned / total) * 100) : 0
  const avgOrder = total > 0 ? Math.round(revenue / total) : 0

  // Top cities
  const cityMap: Record<string, number> = {}
  all.forEach(o => { if (o.shipping_city) cityMap[o.shipping_city] = (cityMap[o.shipping_city] || 0) + 1 })
  const topCities = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Orders by status
  const statusMap: Record<string, number> = {}
  all.forEach(o => { statusMap[o.business_status] = (statusMap[o.business_status] || 0) + 1 })

  // Last 7 days
  const days: { date: string; count: number; revenue: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0)
    const next = new Date(d); next.setDate(next.getDate() + 1)
    const dayOrders = all.filter(o => {
      const t = new Date(o.created_at)
      return t >= d && t < next
    })
    days.push({
      date: d.toLocaleDateString('fr-MA', { weekday: 'short', day: 'numeric' }),
      count: dayOrders.length,
      revenue: dayOrders.reduce((s, o) => s + Number(o.total_price || 0), 0),
    })
  }

  const maxCount = Math.max(...days.map(d => d.count), 1)

  const kpis = [
    { label: 'Total Revenue', value: `${revenue.toLocaleString('fr-MA')} DH`, sub: `${avgOrder} DH avg order`, iconBg: 'bg-emerald-50', icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'Total Orders', value: total.toLocaleString(), sub: `${delivered} delivered`, iconBg: 'bg-blue-50', icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
    { label: 'Confirm Rate', value: `${confirmRate}%`, sub: `${confirmed} confirmed`, iconBg: 'bg-violet-50', icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#8b5cf6" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'Delivery Rate', value: `${deliveryRate}%`, sub: `${returnRate}% returned`, iconBg: 'bg-amber-50', icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg> },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <span className="text-xs text-gray-400 bg-white border border-gray-100 rounded-lg px-3 py-1.5">All time</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${k.iconBg} flex items-center justify-center shrink-0`}>{k.icon}</div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{k.value}</div>
              <div className="text-xs text-gray-400">{k.label}</div>
              <div className="text-xs text-emerald-500 mt-0.5">{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Orders last 7 days */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Orders — Last 7 days</h2>
            <Link href="/admin/orders" className="text-xs text-emerald-600 hover:text-emerald-700">View all →</Link>
          </div>
          <div className="flex items-end gap-2 h-32">
            {days.map(d => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs font-semibold text-gray-700">{d.count}</div>
                <div
                  className="w-full bg-emerald-500 rounded-t-md min-h-[4px] transition-all"
                  style={{ height: `${Math.round((d.count / maxCount) * 100)}%` }}
                />
                <div className="text-[10px] text-gray-400 text-center leading-tight">{d.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Cities */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Cities</h2>
          {topCities.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-8">No data yet</div>
          ) : (
            <div className="space-y-3">
              {topCities.map(([city, count]) => (
                <div key={city} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 truncate">{city}</span>
                      <span className="text-xs text-gray-400 ml-2 shrink-0">{count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.round((count / (topCities[0]?.[1] || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mt-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Orders by Status</h2>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(statusMap).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-500 capitalize">{status.replace(/_/g, ' ')}</span>
              <span className="text-sm font-bold text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
