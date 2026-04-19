import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const [ordersRes, itemsRes] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select('id, total_price, business_status, payment_status, created_at, shipping_city, payment_method'),
    supabaseAdmin
      .from('order_items')
      .select('title, quantity, unit_price, image_url'),
  ])

  const all = ordersRes.data || []
  const items = itemsRes.data || []

  const total = all.length
  const revenue = all.reduce((s, o) => s + Number(o.total_price || 0), 0)
  const delivered = all.filter(o => o.business_status === 'delivered').length
  const returned = all.filter(o => o.business_status === 'returned').length
  const shipped = all.filter(o => o.business_status === 'shipped').length
  const confirmed = all.filter(o => ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.business_status)).length
  const canceled = all.filter(o => o.business_status === 'canceled_confirmation').length
  const pending = all.filter(o => o.business_status === 'pending_confirmation').length

  const confirmRate = total > 0 ? ((confirmed / total) * 100).toFixed(1) : '0'
  const deliveryRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : '0'
  const returnRate = confirmed > 0 ? ((returned / confirmed) * 100).toFixed(1) : '0'
  const avgOrder = total > 0 ? Math.round(revenue / total) : 0

  // Today & yesterday
  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 7)
  const lastWeekStart = new Date(weekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7)

  const todayOrders = all.filter(o => new Date(o.created_at) >= todayStart)
  const yesterdayOrders = all.filter(o => new Date(o.created_at) >= yesterdayStart && new Date(o.created_at) < todayStart)
  const thisWeekOrders = all.filter(o => new Date(o.created_at) >= weekStart)
  const lastWeekOrders = all.filter(o => new Date(o.created_at) >= lastWeekStart && new Date(o.created_at) < weekStart)

  const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total_price || 0), 0)
  const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + Number(o.total_price || 0), 0)
  const thisWeekRevenue = thisWeekOrders.reduce((s, o) => s + Number(o.total_price || 0), 0)
  const lastWeekRevenue = lastWeekOrders.reduce((s, o) => s + Number(o.total_price || 0), 0)

  const weekGrowth = lastWeekOrders.length > 0
    ? Math.round(((thisWeekOrders.length - lastWeekOrders.length) / lastWeekOrders.length) * 100)
    : 0
  const revenueGrowth = lastWeekRevenue > 0
    ? Math.round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100)
    : 0

  // Last 30 days chart
  const days30: { date: string; count: number; revenue: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0)
    const next = new Date(d); next.setDate(next.getDate() + 1)
    const dayOrders = all.filter(o => { const t = new Date(o.created_at); return t >= d && t < next })
    days30.push({
      date: d.toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' }),
      count: dayOrders.length,
      revenue: dayOrders.reduce((s, o) => s + Number(o.total_price || 0), 0),
    })
  }
  const maxCount30 = Math.max(...days30.map(d => d.count), 1)
  const maxRevenue30 = Math.max(...days30.map(d => d.revenue), 1)

  // Top cities (with revenue)
  const cityMap: Record<string, { count: number; revenue: number }> = {}
  all.forEach(o => {
    if (!o.shipping_city) return
    if (!cityMap[o.shipping_city]) cityMap[o.shipping_city] = { count: 0, revenue: 0 }
    cityMap[o.shipping_city].count++
    cityMap[o.shipping_city].revenue += Number(o.total_price || 0)
  })
  const topCities = Object.entries(cityMap).sort((a, b) => b[1].count - a[1].count).slice(0, 10)

  // Top products
  const productMap: Record<string, { qty: number; revenue: number; image: string | null }> = {}
  items.forEach(item => {
    const key = item.title || 'Unknown'
    if (!productMap[key]) productMap[key] = { qty: 0, revenue: 0, image: item.image_url }
    productMap[key].qty += item.quantity || 1
    productMap[key].revenue += Number(item.unit_price || 0) * (item.quantity || 1)
  })
  const topProducts = Object.entries(productMap).sort((a, b) => b[1].qty - a[1].qty).slice(0, 6)

  // Payment methods
  const payMap: Record<string, number> = {}
  all.forEach(o => {
    const m = o.payment_method || 'COD'
    payMap[m] = (payMap[m] || 0) + 1
  })

  const STATUS_LABEL: Record<string, string> = {
    pending_confirmation: 'Pending', confirmed: 'Confirmed', to_edit: 'To Edit',
    canceled_confirmation: 'Canceled', processing: 'Processing', shipped: 'Shipped',
    delivered: 'Delivered', returned: 'Returned', out_of_stock: 'Out of Stock',
    blocked_customer: 'Blocked',
  }
  const STATUS_COLOR: Record<string, string> = {
    pending_confirmation: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    to_edit: 'bg-orange-100 text-orange-700',
    canceled_confirmation: 'bg-red-100 text-red-700',
    processing: 'bg-violet-100 text-violet-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    returned: 'bg-gray-100 text-gray-600',
    out_of_stock: 'bg-pink-100 text-pink-700',
  }

  function trend(val: number) {
    if (val > 0) return <span className="text-xs text-emerald-500 font-medium">↑ {val}%</span>
    if (val < 0) return <span className="text-xs text-red-500 font-medium">↓ {Math.abs(val)}%</span>
    return <span className="text-xs text-gray-400">→ 0%</span>
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <span className="text-xs text-gray-400 bg-white border border-gray-100 rounded-lg px-3 py-1.5">All time data</span>
      </div>

      {/* KPIs row 1 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `${revenue.toLocaleString('fr-MA')} DH`, sub: `Avg ${avgOrder} DH / order`, iconBg: 'bg-emerald-50', icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          { label: 'Total Orders', value: total.toLocaleString(), sub: `${todayOrders.length} today`, iconBg: 'bg-blue-50', icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
          { label: 'Confirm Rate', value: `${confirmRate}%`, sub: `${confirmed} confirmed`, iconBg: 'bg-violet-50', icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#8b5cf6" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          { label: 'Delivery Rate', value: `${deliveryRate}%`, sub: `${returnRate}% return rate`, iconBg: 'bg-amber-50', icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> },
        ].map(k => (
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

      {/* Today vs Yesterday + This week vs Last week */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 mb-1">Today — Orders</div>
          <div className="text-2xl font-bold text-gray-900">{todayOrders.length}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs text-gray-400">vs yesterday ({yesterdayOrders.length})</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 mb-1">Today — Revenue</div>
          <div className="text-2xl font-bold text-gray-900">{todayRevenue.toLocaleString('fr-MA')} DH</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs text-gray-400">vs {yesterdayRevenue.toLocaleString()} DH</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 mb-1">This week — Orders</div>
          <div className="text-2xl font-bold text-gray-900">{thisWeekOrders.length}</div>
          <div className="flex items-center gap-1.5 mt-1">
            {trend(weekGrowth)}
            <span className="text-xs text-gray-400">vs last week</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 mb-1">This week — Revenue</div>
          <div className="text-2xl font-bold text-gray-900">{thisWeekRevenue.toLocaleString('fr-MA')} DH</div>
          <div className="flex items-center gap-1.5 mt-1">
            {trend(revenueGrowth)}
            <span className="text-xs text-gray-400">vs last week</span>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-5">
        {/* Orders 30 days */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-gray-900">Orders — Last 30 days</h2>
            <Link href="/admin/orders" className="text-xs text-emerald-600 hover:text-emerald-700">View all →</Link>
          </div>
          <div className="text-xs text-gray-400 mb-4">{thisWeekOrders.length} this week · {total} total</div>
          <div className="flex items-end gap-0.5 h-28">
            {days30.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative">
                <div
                  className="w-full bg-emerald-500 hover:bg-emerald-600 rounded-sm min-h-[2px] transition-all cursor-default"
                  style={{ height: `${Math.round((d.count / maxCount30) * 100)}%` }}
                  title={`${d.date}: ${d.count} orders · ${d.revenue.toLocaleString()} DH`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-gray-400">
            <span>{days30[0]?.date}</span>
            <span>{days30[14]?.date}</span>
            <span>{days30[29]?.date}</span>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Conversion Funnel</h2>
          <div className="space-y-2">
            {[
              { label: 'Total Orders', value: total, color: 'bg-gray-200', pct: 100 },
              { label: 'Confirmed', value: confirmed, color: 'bg-blue-400', pct: total > 0 ? Math.round((confirmed / total) * 100) : 0 },
              { label: 'Shipped', value: shipped, color: 'bg-violet-400', pct: total > 0 ? Math.round((shipped / total) * 100) : 0 },
              { label: 'Delivered', value: delivered, color: 'bg-emerald-500', pct: total > 0 ? Math.round((delivered / total) * 100) : 0 },
              { label: 'Returned', value: returned, color: 'bg-red-400', pct: total > 0 ? Math.round((returned / total) * 100) : 0 },
              { label: 'Canceled', value: canceled, color: 'bg-gray-300', pct: total > 0 ? Math.round((canceled / total) * 100) : 0 },
            ].map(s => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">{s.label}</span>
                  <span className="text-xs font-semibold text-gray-900">{s.value} <span className="font-normal text-gray-400">({s.pct}%)</span></span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top products + Top cities */}
      <div className="grid grid-cols-2 gap-5">
        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Products</h2>
          {topProducts.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-8">No product data</div>
          ) : (
            <div className="space-y-3">
              {topProducts.map(([name, data], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-300 w-5 shrink-0">#{i + 1}</span>
                  {data.image ? (
                    <img src={data.image} alt="" className="w-8 h-8 rounded-lg object-cover border border-gray-100 shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gray-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800 truncate">{name}</div>
                    <div className="text-[10px] text-gray-400">{data.revenue.toLocaleString('fr-MA')} DH revenue</div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 shrink-0">{data.qty} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Cities */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Cities</h2>
          {topCities.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-8">No data</div>
          ) : (
            <div className="space-y-2.5">
              {topCities.map(([city, data]) => (
                <div key={city} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 truncate">{city}</span>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <span className="text-[10px] text-gray-400">{data.revenue.toLocaleString('fr-MA')} DH</span>
                        <span className="text-xs font-semibold text-gray-900">{data.count}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.round((data.count / (topCities[0]?.[1].count || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status breakdown + Payment methods */}
      <div className="grid grid-cols-2 gap-5">
        {/* Status breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Orders by Status</h2>
          <div className="space-y-2">
            {[
              { status: 'pending_confirmation', value: pending },
              { status: 'confirmed', value: confirmed },
              { status: 'shipped', value: shipped },
              { status: 'delivered', value: delivered },
              { status: 'returned', value: returned },
              { status: 'canceled_confirmation', value: canceled },
            ].filter(s => s.value > 0).map(s => (
              <div key={s.status} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${STATUS_COLOR[s.status] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABEL[s.status] || s.status}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
                  <span className="text-sm font-bold text-gray-900 w-10 text-right">{s.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment methods */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Payment Methods</h2>
          {Object.keys(payMap).length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-8">No data</div>
          ) : (
            <div className="space-y-2">
              {Object.entries(payMap).sort((a, b) => b[1] - a[1]).map(([method, count]) => (
                <div key={method} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">{method}</span>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <span className="text-xs text-gray-400">{total > 0 ? Math.round((count / total) * 100) : 0}%</span>
                        <span className="text-sm font-bold text-gray-900">{count}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full"
                        style={{ width: `${total > 0 ? Math.round((count / total) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
