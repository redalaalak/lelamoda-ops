import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AnalyticsProductsPage() {
  const [ordersRes, itemsRes] = await Promise.all([
    supabaseAdmin.from('orders').select('id, total_price, business_status, created_at, shipping_city'),
    supabaseAdmin.from('order_items').select('order_id, title, quantity, unit_price, image_url'),
  ])

  const orders = ordersRes.data || []
  const items = itemsRes.data || []

  const total = orders.length
  const revenue = orders.reduce((s, o) => s + Number(o.total_price || 0), 0)
  const unitsSold = items.reduce((s, i) => s + (i.quantity || 1), 0)
  const avgOrderValue = total > 0 ? revenue / total : 0
  const delivered = orders.filter(o => o.business_status === 'delivered').length
  const returned = orders.filter(o => o.business_status === 'returned').length

  // Top products by revenue
  const prodMap: Record<string, { qty: number; revenue: number; orders: number; delivered: number; returned: number; image: string | null }> = {}
  items.forEach(item => {
    const key = item.title || 'Unknown'
    if (!prodMap[key]) prodMap[key] = { qty: 0, revenue: 0, orders: 0, delivered: 0, returned: 0, image: item.image_url }
    prodMap[key].qty += item.quantity || 1
    prodMap[key].revenue += Number(item.unit_price || 0) * (item.quantity || 1)
    prodMap[key].orders++
  })

  // Link orders to products for delivered/returned stats
  const orderStatusMap: Record<string, string> = {}
  orders.forEach(o => { orderStatusMap[o.id] = o.business_status })
  items.forEach(item => {
    const status = orderStatusMap[item.order_id]
    if (status === 'delivered') prodMap[item.title || 'Unknown'].delivered++
    if (status === 'returned') prodMap[item.title || 'Unknown'].returned++
  })

  const topProducts = Object.entries(prodMap).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 10)

  // City performance
  const cityMap: Record<string, { orders: number; revenue: number; delivered: number }> = {}
  orders.forEach(o => {
    if (!o.shipping_city) return
    if (!cityMap[o.shipping_city]) cityMap[o.shipping_city] = { orders: 0, revenue: 0, delivered: 0 }
    cityMap[o.shipping_city].orders++
    cityMap[o.shipping_city].revenue += Number(o.total_price || 0)
    if (o.business_status === 'delivered') cityMap[o.shipping_city].delivered++
  })
  const topCities = Object.entries(cityMap).sort((a, b) => b[1].orders - a[1].orders).slice(0, 10)

  // Last 7 days chart
  const days7: { date: string; revenue: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0)
    const next = new Date(d); next.setDate(next.getDate() + 1)
    const dayRev = orders.filter(o => new Date(o.created_at) >= d && new Date(o.created_at) < next)
      .reduce((s, o) => s + Number(o.total_price || 0), 0)
    days7.push({ date: d.toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' }), revenue: dayRev })
  }
  const maxRev7 = Math.max(...days7.map(d => d.revenue), 1)

  // Conversion funnel
  const confirmed = orders.filter(o => ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.business_status)).length
  const processed = orders.filter(o => ['processing', 'shipped', 'delivered'].includes(o.business_status)).length
  const shipped = orders.filter(o => ['shipped', 'delivered'].includes(o.business_status)).length
  const funnel = [
    { label: 'Created', value: total, color: 'bg-emerald-500', pct: 100 },
    { label: 'Confirmed', value: confirmed, color: 'bg-emerald-400', pct: total > 0 ? Math.round((confirmed / total) * 100) : 0 },
    { label: 'Processed', value: processed, color: 'bg-blue-400', pct: total > 0 ? Math.round((processed / total) * 100) : 0 },
    { label: 'Shipped', value: shipped, color: 'bg-violet-400', pct: total > 0 ? Math.round((shipped / total) * 100) : 0 },
    { label: 'Delivered', value: delivered, color: 'bg-teal-500', pct: total > 0 ? Math.round((delivered / total) * 100) : 0 },
  ]

  function fmt(n: number) {
    if (n >= 1000) return `MAD${(n / 1000).toFixed(1)}K`
    return `MAD${n.toFixed(0)}`
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/analytics/orders" className="text-gray-400 hover:text-gray-600 transition">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Analytics: Products</h1>
        </div>
        <span className="text-xs text-gray-400 bg-white border border-gray-100 rounded-lg px-3 py-1.5">All time</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: fmt(revenue), sub: 'All orders' },
          { label: 'Total Profit', value: fmt(revenue), sub: 'Gross (no costs set)' },
          { label: 'Units Sold', value: unitsSold.toLocaleString(), sub: `${topProducts[0]?.[0] || '—'} top product` },
          { label: 'Avg Order Value', value: `MAD${avgOrderValue.toFixed(2)}`, sub: `${total} Orders` },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-gray-500 mb-2">{k.label}</div>
            <div className="text-2xl font-bold text-gray-900">{k.value}</div>
            <div className="text-xs text-gray-400 mt-1.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Sales chart + City performance */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Sales Over Time</h2>
          <div className="text-xs text-gray-400 mb-4">Last 7 days</div>
          <div className="flex items-end gap-1 h-32 mb-2">
            {days7.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-emerald-500 hover:bg-emerald-600 rounded-t-md min-h-[4px] transition-all cursor-default"
                  style={{ height: `${Math.round((d.revenue / maxRev7) * 100)}%` }}
                  title={`${d.date}: ${fmt(d.revenue)}`}
                />
                <div className="text-[9px] text-gray-400">{d.date}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-50">
            <div><div className="text-xs text-gray-400">Total Revenue</div><div className="text-sm font-bold text-gray-900">{fmt(revenue)}</div></div>
            <div><div className="text-xs text-gray-400">Total Orders</div><div className="text-sm font-bold text-gray-900">{total}</div></div>
            <div><div className="text-xs text-gray-400">Units Sold</div><div className="text-sm font-bold text-gray-900">{unitsSold}</div></div>
          </div>
        </div>

        {/* City Performance */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">City Performance</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">#</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">City</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-400">Orders</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-400">Revenue</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-400">Rate</th>
              </tr>
            </thead>
            <tbody>
              {topCities.slice(0, 8).map(([city, data], i) => (
                <tr key={city} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2 text-xs font-medium text-gray-800">{city}</td>
                  <td className="px-4 py-2 text-right text-xs font-semibold text-gray-900">{data.orders}</td>
                  <td className="px-4 py-2 text-right text-xs font-semibold text-gray-900">{fmt(data.revenue)}</td>
                  <td className="px-4 py-2 text-right text-xs font-semibold text-emerald-600">
                    {data.orders > 0 ? Math.round((data.delivered / data.orders) * 100) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Products + Product Profitability */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Products by Revenue</h2>
          <div className="space-y-3">
            {topProducts.map(([name, data], i) => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-300 w-5 shrink-0">{i + 1}</span>
                {data.image ? (
                  <img src={data.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-800 truncate">{name}</div>
                  <div className="text-[10px] text-gray-400">{data.qty} Units · {data.orders} Orders</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-gray-900">{fmt(data.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-50">
            <div><div className="text-xs text-gray-400">Total Revenue</div><div className="text-sm font-bold text-gray-900">{fmt(revenue)}</div></div>
            <div><div className="text-xs text-gray-400">Total Units</div><div className="text-sm font-bold text-gray-900">{unitsSold}</div></div>
          </div>
        </div>

        {/* Product Profitability */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Product Profitability</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">#</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">Product</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-400">Revenue</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-400">Margin</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map(([name, data], i) => (
                <tr key={name} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {data.image && <img src={data.image} alt="" className="w-6 h-6 rounded object-cover border border-gray-100 shrink-0" />}
                      <span className="text-xs text-gray-700 truncate max-w-[120px]">{name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-xs font-semibold text-gray-900">{fmt(data.revenue)}</td>
                  <td className="px-4 py-2 text-right text-xs font-semibold text-emerald-600">100%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-50 grid grid-cols-3 gap-2">
            <div><div className="text-xs text-gray-400">Total Revenue</div><div className="text-xs font-bold text-gray-900">{fmt(revenue)}</div></div>
            <div><div className="text-xs text-gray-400">Total Profit</div><div className="text-xs font-bold text-emerald-600">{fmt(revenue)}</div></div>
            <div><div className="text-xs text-gray-400">Avg Margin</div><div className="text-xs font-bold text-emerald-600">100%</div></div>
          </div>
        </div>
      </div>

      {/* Conversion Funnel + Delivery Success Rate */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Conversion Funnel</h2>
          <div className="space-y-3">
            {funnel.map(s => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-600">{s.label} <span className="text-gray-400">({s.value})</span></span>
                  <span className="text-xs font-semibold text-gray-900">{s.pct}%</span>
                </div>
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div className={`h-full ${s.color} rounded-lg flex items-center justify-center transition-all`} style={{ width: `${s.pct}%` }}>
                    {s.pct > 15 && <span className="text-xs font-bold text-white">{s.value}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-50">
            <span className="text-xs text-gray-500 font-medium">Overall Conversion</span>
            <span className="text-sm font-bold text-emerald-600">{total > 0 ? Math.round((delivered / total) * 100) : 0}%</span>
          </div>
        </div>

        {/* Delivery Success Rate */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Delivery Success Rate</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">#</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">Product</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-400">Orders</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-400">Delivered</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-400">Returned</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map(([name, data], i) => (
                <tr key={name} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2 text-xs text-gray-700 truncate max-w-[130px]">{name}</td>
                  <td className="px-4 py-2 text-right text-xs font-semibold text-gray-900">{data.orders}</td>
                  <td className="px-4 py-2 text-right text-xs font-semibold text-emerald-600">
                    {data.orders > 0 ? Math.round((data.delivered / data.orders) * 100) : 0}%
                  </td>
                  <td className="px-4 py-2 text-right text-xs font-semibold text-red-500">
                    {data.orders > 0 ? Math.round((data.returned / data.orders) * 100) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-50 grid grid-cols-3 gap-2">
            <div><div className="text-xs text-gray-400">Total Orders</div><div className="text-xs font-bold text-gray-900">{total}</div></div>
            <div><div className="text-xs text-gray-400">Avg Delivery</div><div className="text-xs font-bold text-emerald-600">{total > 0 ? Math.round((delivered / total) * 100) : 0}%</div></div>
            <div><div className="text-xs text-gray-400">Avg Return</div><div className="text-xs font-bold text-red-500">{total > 0 ? Math.round((returned / total) * 100) : 0}%</div></div>
          </div>
        </div>
      </div>
    </div>
  )
}
