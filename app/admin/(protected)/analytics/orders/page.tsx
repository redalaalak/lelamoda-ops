import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'
import DateRangePicker from '@/components/analytics/DateRangePicker'

export const dynamic = 'force-dynamic'

// SVG Donut Chart — server-side, no deps
function DonutChart({ segments, total }: {
  segments: { label: string; value: number; color: string }[]
  total: number
}) {
  const r = 52, cx = 70, cy = 70
  const C = 2 * Math.PI * r
  let acc = 0
  const slices = segments.map(s => {
    const frac = total > 0 ? s.value / total : 0
    const dash = frac * C
    const sl = { ...s, dash, acc }
    acc += dash
    return sl
  })
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={18} />
      ) : slices.filter(s => s.dash > 0.5).map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={s.color} strokeWidth={18}
          strokeDasharray={`${s.dash} ${C}`}
          strokeDashoffset={-s.acc}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      <text x={cx} y={cy - 7} textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="Inter,sans-serif">Total Orders</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fill="#111827" fontSize="17" fontWeight="700" fontFamily="Inter,sans-serif">{total.toLocaleString()}</text>
    </svg>
  )
}

const STATUS_COLORS: Record<string, string> = {
  pending_confirmation: '#f59e0b',
  confirmed: '#10b981',
  processing: '#6366f1',
  shipped: '#8b5cf6',
  delivered: '#059669',
  returned: '#dc2626',
  canceled_confirmation: '#9ca3af',
  to_edit: '#f97316',
  out_of_stock: '#ec4899',
}
const STATUS_LABEL: Record<string, string> = {
  pending_confirmation: 'pending', confirmed: 'confirmed', processing: 'processed',
  shipped: 'shipped', delivered: 'delivered', returned: 'returned',
  canceled_confirmation: 'canceled', to_edit: 'to edit', out_of_stock: 'out of stock',
}

export default async function AnalyticsOrdersPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const fromDate = searchParams.from
  const toDate = searchParams.to

  let ordersQuery = supabaseAdmin.from('orders').select('id, shopify_order_name, shopify_order_number, total_price, business_status, payment_status, created_at, shipping_city, utm_source, customer_full_name, customer_id')
  if (fromDate) ordersQuery = ordersQuery.gte('created_at', fromDate + 'T00:00:00')
  if (toDate) ordersQuery = ordersQuery.lte('created_at', toDate + 'T23:59:59')

  const [ordersRes, customersRes] = await Promise.all([
    ordersQuery,
    supabaseAdmin.from('customers').select('id, full_name, phone, is_blocked'),
  ])

  const all = ordersRes.data || []
  const customers = customersRes.data || []

  const total = all.length
  const revenue = all.reduce((s, o) => s + Number(o.total_price || 0), 0)
  const delivered = all.filter(o => o.business_status === 'delivered').length
  const returned = all.filter(o => o.business_status === 'returned').length
  const confirmed = all.filter(o => ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.business_status)).length

  const deliveredRatio = total > 0 ? ((delivered / total) * 100).toFixed(1) : '0'
  const returnedRatio = total > 0 ? ((returned / total) * 100).toFixed(1) : '0'

  // Period comparison (this month vs last month)
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const thisMonth = all.filter(o => new Date(o.created_at) >= thisMonthStart)
  const lastMonth = all.filter(o => new Date(o.created_at) >= lastMonthStart && new Date(o.created_at) < thisMonthStart)
  const thisMonthRevenue = thisMonth.reduce((s, o) => s + Number(o.total_price || 0), 0)
  const lastMonthRevenue = lastMonth.reduce((s, o) => s + Number(o.total_price || 0), 0)
  const thisMonthDelivered = thisMonth.filter(o => o.business_status === 'delivered').length
  const lastMonthDelivered = lastMonth.filter(o => o.business_status === 'delivered').length
  const thisMonthReturned = thisMonth.filter(o => o.business_status === 'returned').length

  const ordersChange = lastMonth.length > 0 ? (((thisMonth.length - lastMonth.length) / lastMonth.length) * 100).toFixed(1) : null
  const revenueChange = lastMonthRevenue > 0 ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1) : null
  const deliveredChange = lastMonthDelivered > 0 ? (((thisMonthDelivered - lastMonthDelivered) / lastMonthDelivered) * 100).toFixed(1) : null
  const returnedChangeVal = lastMonth.length > 0
    ? ((thisMonthReturned / Math.max(thisMonth.length, 1)) - (lastMonth.filter(o => o.business_status === 'returned').length / Math.max(lastMonth.length, 1))) * 100
    : 0

  // Status breakdown for donut
  const statusMap: Record<string, number> = {}
  all.forEach(o => { statusMap[o.business_status] = (statusMap[o.business_status] || 0) + 1 })
  const donutSegments = Object.entries(statusMap)
    .sort((a, b) => b[1] - a[1])
    .map(([status, value]) => ({ label: STATUS_LABEL[status] || status, value, color: STATUS_COLORS[status] || '#e5e7eb' }))

  // Orders by source
  const sourceMap: Record<string, number> = {}
  all.forEach(o => { const s = o.utm_source || 'Shopify'; sourceMap[s] = (sourceMap[s] || 0) + 1 })
  const maxSource = Math.max(...Object.values(sourceMap), 1)

  // Top cities
  const cityMap: Record<string, { orders: number; delivered: number; returned: number }> = {}
  all.forEach(o => {
    if (!o.shipping_city) return
    if (!cityMap[o.shipping_city]) cityMap[o.shipping_city] = { orders: 0, delivered: 0, returned: 0 }
    cityMap[o.shipping_city].orders++
    if (o.business_status === 'delivered') cityMap[o.shipping_city].delivered++
    if (o.business_status === 'returned') cityMap[o.shipping_city].returned++
  })
  const topCities = Object.entries(cityMap).sort((a, b) => b[1].orders - a[1].orders).slice(0, 10)
  const maxCityOrders = topCities[0]?.[1].orders || 1

  // Highest / lowest price orders
  const sorted = [...all].sort((a, b) => Number(b.total_price) - Number(a.total_price))
  const highest = sorted.slice(0, 5)
  const lowest = sorted.slice(-5).reverse()

  // Top customers
  const custOrderMap: Record<string, { name: string; phone: string; orders: number; revenue: number; is_blocked: boolean }> = {}
  all.forEach(o => {
    if (!o.customer_id) return
    const cust = customers.find(c => c.id === o.customer_id)
    if (!custOrderMap[o.customer_id]) {
      custOrderMap[o.customer_id] = {
        name: cust?.full_name || o.customer_full_name || '',
        phone: cust?.phone || '',
        orders: 0, revenue: 0,
        is_blocked: cust?.is_blocked || false,
      }
    }
    custOrderMap[o.customer_id].orders++
    custOrderMap[o.customer_id].revenue += Number(o.total_price || 0)
  })
  const topCustomers = Object.entries(custOrderMap)
    .sort((a, b) => b[1].orders - a[1].orders)
    .slice(0, 8)

  function pctChange(val: string | null, positive = true) {
    if (!val) return null
    const n = parseFloat(val)
    const up = n >= 0
    const color = (up === positive) ? 'text-emerald-500' : 'text-red-500'
    return <span className={`text-xs font-medium ${color}`}>{up ? '↑' : '↓'} {Math.abs(n)}%</span>
  }

  function initials(name: string) {
    if (!name?.trim()) return '?'
    const p = name.trim().split(/\s+/)
    return (p.length >= 2 ? p[0][0] + p[1][0] : p[0].slice(0, 2)).toUpperCase()
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/analytics" className="text-gray-400 hover:text-gray-600 transition">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Analytics: Orders</h1>
        </div>
        <DateRangePicker />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: thisMonth.length.toLocaleString(), change: ordersChange, sub: `Vs previous period · ${lastMonth.length > 0 ? (thisMonth.length - lastMonth.length > 0 ? '+' : '') + (thisMonth.length - lastMonth.length) : '—'}`, positive: true },
          { label: 'Orders Total Amount', value: `MAD${(thisMonthRevenue / 1000).toFixed(2)}k`, change: revenueChange, sub: `Vs previous period · MAD${((thisMonthRevenue - lastMonthRevenue) / 1000).toFixed(2)}k`, positive: true },
          { label: 'Delivered Orders Ratio', value: `${deliveredRatio}%`, change: deliveredChange, sub: `Vs previous period · ${lastMonthDelivered > 0 ? (((thisMonthDelivered / Math.max(thisMonth.length, 1)) - (lastMonthDelivered / Math.max(lastMonth.length, 1))) * 100).toFixed(2) : '—'}%`, positive: true },
          { label: 'Returned Orders Ratio', value: `${returnedRatio}%`, change: returnedChangeVal !== 0 ? Math.abs(returnedChangeVal).toFixed(1) : null, sub: `Vs previous period`, positive: false },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-gray-500 mb-2">{k.label}</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{k.value}</span>
              {pctChange(k.change, k.positive)}
            </div>
            <div className="text-xs text-gray-400 mt-1.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-5">
        {/* Orders By Status — donut */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Orders By Status</h2>
          <div className="flex items-center gap-6">
            <DonutChart segments={donutSegments} total={total} />
            <div className="flex-1 space-y-2">
              {donutSegments.map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-xs text-gray-600 flex-1">{s.label}</span>
                  <span className="text-xs font-semibold text-gray-900">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Orders By Source */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Orders By Source</h2>
          <div className="space-y-3">
            {Object.entries(sourceMap).sort((a, b) => b[1] - a[1]).map(([source, count]) => (
              <div key={source}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{source}</span>
                  <span className="text-xs font-semibold text-gray-900">{count}</span>
                </div>
                <div className="h-6 bg-gray-100 rounded-md overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-md transition-all flex items-center justify-end pr-2"
                    style={{ width: `${Math.round((count / maxSource) * 100)}%` }}
                  >
                    <span className="text-[10px] text-white font-medium">{Math.round((count / total) * 100)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cities row */}
      <div className="grid grid-cols-2 gap-5">
        {/* Orders By City */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Orders By City</h2>
          <div className="space-y-2.5">
            {topCities.map(([city, data]) => (
              <div key={city} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-24 shrink-0 truncate">{city}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-md overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-md"
                    style={{ width: `${Math.round((data.orders / maxCityOrders) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-900 w-8 text-right shrink-0">{data.orders}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Orders Ratios By City */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Orders Ratios By City</h2>
          <div className="space-y-2.5">
            {topCities.map(([city, data]) => {
              const delivPct = data.orders > 0 ? Math.round((data.delivered / data.orders) * 100) : 0
              const retPct = data.orders > 0 ? Math.round((data.returned / data.orders) * 100) : 0
              return (
                <div key={city} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-24 shrink-0 truncate">{city}</span>
                  <div className="flex-1 h-5 rounded-md overflow-hidden flex">
                    <div className="h-full bg-emerald-500" style={{ width: `${delivPct}%` }} />
                    <div className="h-full bg-red-400" style={{ width: `${retPct}%` }} />
                    <div className="h-full bg-gray-100 flex-1" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 w-8 text-right shrink-0">{delivPct}%</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-xs text-gray-500">Delivered</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /><span className="text-xs text-gray-500">Returned</span></div>
          </div>
        </div>
      </div>

      {/* Highest / Lowest orders */}
      <div className="grid grid-cols-2 gap-5">
        {[
          { title: 'Orders With Highest Price', orders: highest },
          { title: 'Orders With Lowest Price', orders: lowest },
        ].map(({ title, orders }) => (
          <div key={title} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Number</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Customer</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Date</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/orders/${o.id}`} className="text-xs font-semibold text-gray-700 hover:text-emerald-600">
                        {o.shopify_order_name?.replace('#', '') || o.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-bold text-gray-500">{initials(o.customer_full_name || '')}</span>
                        </div>
                        <span className="text-xs text-gray-700 truncate max-w-[80px]">{o.customer_full_name?.split(' ')[0] || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                    <td className="px-4 py-2.5 text-right text-xs font-bold text-gray-900">MAD{Number(o.total_price).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Top Customers</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Customer</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Phone</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Orders</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Amount</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {topCustomers.map(([id, c]) => (
              <tr key={id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-emerald-700">{initials(c.name)}</span>
                    </div>
                    <Link href={`/admin/customers/${id}`} className="text-xs font-medium text-gray-800 hover:text-emerald-600 truncate max-w-[120px]">
                      {c.name || '—'}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{c.phone || '—'}</td>
                <td className="px-4 py-2.5 text-right text-sm font-bold text-gray-900">{c.orders}</td>
                <td className="px-4 py-2.5 text-right text-xs font-semibold text-gray-900">
                  MAD{c.revenue >= 1000 ? `${(c.revenue / 1000).toFixed(2)}k` : c.revenue.toFixed(0)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${c.is_blocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {c.is_blocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
              </tr>
            ))}
            {topCustomers.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-sm text-gray-400">No customer data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
