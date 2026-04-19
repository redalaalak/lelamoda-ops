import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function DonutChart({ segments, total }: { segments: { color: string; value: number }[]; total: number }) {
  const r = 52, cx = 70, cy = 70, C = 2 * Math.PI * r
  let acc = 0
  const slices = segments.map(s => {
    const dash = total > 0 ? (s.value / total) * C : 0
    const sl = { ...s, dash, acc }
    acc += dash
    return sl
  })
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {total === 0 ? <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={18} /> :
        slices.filter(s => s.dash > 0.5).map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={18}
            strokeDasharray={`${s.dash} ${C}`} strokeDashoffset={-s.acc}
            transform={`rotate(-90 ${cx} ${cy})`} />
        ))}
      <text x={cx} y={cy - 7} textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="Inter,sans-serif">Total Orders</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fill="#111827" fontSize="17" fontWeight="700" fontFamily="Inter,sans-serif">{total.toLocaleString()}</text>
    </svg>
  )
}

const STATUS_COLORS: Record<string, string> = {
  pending_confirmation: '#f59e0b', confirmed: '#10b981', processing: '#6366f1',
  shipped: '#8b5cf6', delivered: '#059669', returned: '#dc2626',
  canceled_confirmation: '#9ca3af', to_edit: '#f97316',
}
const STATUS_LABEL: Record<string, string> = {
  pending_confirmation: 'pending', confirmed: 'confirmed', processing: 'processed',
  shipped: 'shipped', delivered: 'delivered', returned: 'returned',
  canceled_confirmation: 'canceled', to_edit: 'to edit',
}

export default async function AnalyticsUTMPage() {
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, total_price, business_status, created_at, utm_source, utm_medium, utm_campaign')

  const all = orders || []
  const utmOrders = all.filter(o => o.utm_source || o.utm_medium || o.utm_campaign)

  const total = utmOrders.length
  const confirmed = utmOrders.filter(o => ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.business_status)).length
  const delivered = utmOrders.filter(o => o.business_status === 'delivered').length
  const returned = utmOrders.filter(o => o.business_status === 'returned').length
  const revenue = utmOrders.reduce((s, o) => s + Number(o.total_price || 0), 0)

  // Status donut
  const statusMap: Record<string, number> = {}
  utmOrders.forEach(o => { statusMap[o.business_status] = (statusMap[o.business_status] || 0) + 1 })
  const donutSegments = Object.entries(statusMap)
    .map(([status, value]) => ({ color: STATUS_COLORS[status] || '#e5e7eb', value, label: STATUS_LABEL[status] || status }))

  // UTM Source breakdown
  const sourceMap: Record<string, { total: number; confirmed: number; delivered: number; returned: number; revenue: number }> = {}
  utmOrders.forEach(o => {
    const s = o.utm_source || 'direct'
    if (!sourceMap[s]) sourceMap[s] = { total: 0, confirmed: 0, delivered: 0, returned: 0, revenue: 0 }
    sourceMap[s].total++
    if (['confirmed', 'processing', 'shipped', 'delivered'].includes(o.business_status)) sourceMap[s].confirmed++
    if (o.business_status === 'delivered') sourceMap[s].delivered++
    if (o.business_status === 'returned') sourceMap[s].returned++
    sourceMap[s].revenue += Number(o.total_price || 0)
  })

  // UTM Medium breakdown
  const mediumMap: Record<string, { total: number; confirmed: number; delivered: number; returned: number; revenue: number }> = {}
  utmOrders.forEach(o => {
    const m = o.utm_medium || 'none'
    if (!mediumMap[m]) mediumMap[m] = { total: 0, confirmed: 0, delivered: 0, returned: 0, revenue: 0 }
    mediumMap[m].total++
    if (['confirmed', 'processing', 'shipped', 'delivered'].includes(o.business_status)) mediumMap[m].confirmed++
    if (o.business_status === 'delivered') mediumMap[m].delivered++
    if (o.business_status === 'returned') mediumMap[m].returned++
    mediumMap[m].revenue += Number(o.total_price || 0)
  })

  // UTM Campaign breakdown
  const campMap: Record<string, { total: number; confirmed: number; delivered: number; returned: number; revenue: number }> = {}
  utmOrders.forEach(o => {
    if (!o.utm_campaign) return
    const c = o.utm_campaign
    if (!campMap[c]) campMap[c] = { total: 0, confirmed: 0, delivered: 0, returned: 0, revenue: 0 }
    campMap[c].total++
    if (['confirmed', 'processing', 'shipped', 'delivered'].includes(o.business_status)) campMap[c].confirmed++
    if (o.business_status === 'delivered') campMap[c].delivered++
    if (o.business_status === 'returned') campMap[c].returned++
    campMap[c].revenue += Number(o.total_price || 0)
  })

  function fmt(n: number) {
    if (n >= 1000) return `MAD${(n / 1000).toFixed(2)}k`
    return `MAD${n.toFixed(2)}`
  }

  function colorNum(n: number, good = true) {
    if (n === 0) return <span className="text-gray-400">0</span>
    if (good) return <span className="text-emerald-600 font-semibold">{n}</span>
    return <span className="text-red-500 font-semibold">{n}</span>
  }

  function UTMTable({ title, data }: { title: string; data: Record<string, { total: number; confirmed: number; delivered: number; returned: number; revenue: number }> }) {
    const rows = Object.entries(data).sort((a, b) => b[1].total - a[1].total)
    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">{title.split(' ').pop()}</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Total</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Confirmed</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Delivered</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Returned</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-sm text-gray-400">No UTM data</td></tr>
            ) : rows.map(([key, d]) => (
              <tr key={key} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="px-4 py-2.5 text-xs font-medium text-gray-800">{key}</td>
                <td className="px-4 py-2.5 text-right text-xs font-semibold text-gray-900">{d.total}</td>
                <td className="px-4 py-2.5 text-right text-xs">{colorNum(d.confirmed)}</td>
                <td className="px-4 py-2.5 text-right text-xs">{colorNum(d.delivered)}</td>
                <td className="px-4 py-2.5 text-right text-xs">{colorNum(d.returned, false)}</td>
                <td className="px-4 py-2.5 text-right text-xs font-medium text-gray-700">{fmt(d.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
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
          <h1 className="text-xl font-bold text-gray-900">Analytics: UTM</h1>
        </div>
        <span className="text-xs text-gray-400 bg-white border border-gray-100 rounded-lg px-3 py-1.5">All time</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total UTM Orders', value: total, color: 'text-gray-900' },
          { label: 'Confirmed Orders', value: confirmed, color: 'text-emerald-600' },
          { label: 'Delivered Orders', value: delivered, color: 'text-teal-600' },
          { label: 'Revenue', value: fmt(revenue), color: 'text-gray-900' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-gray-500 mb-2">{k.label}</div>
            <div className={`text-2xl font-bold ${k.color}`}>{typeof k.value === 'number' ? k.value.toLocaleString() : k.value}</div>
            <div className="text-xs text-gray-400 mt-1.5">Vs previous period</div>
          </div>
        ))}
      </div>

      {/* Donut + Source table */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Orders By Status</h2>
          <div className="flex items-center gap-6">
            <DonutChart segments={donutSegments} total={total} />
            <div className="flex-1 flex flex-wrap gap-x-4 gap-y-2">
              {donutSegments.map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-xs text-gray-500">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Orders By UTM Source</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Source</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Total</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Confirmed</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Delivered</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Returned</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(sourceMap).sort((a, b) => b[1].total - a[1].total).length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-sm text-gray-400">No UTM data yet</td></tr>
              ) : Object.entries(sourceMap).sort((a, b) => b[1].total - a[1].total).map(([src, d]) => (
                <tr key={src} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-xs font-medium text-gray-800">{src}</td>
                  <td className="px-4 py-2.5 text-right text-xs font-semibold text-gray-900">{d.total}</td>
                  <td className="px-4 py-2.5 text-right text-xs">{colorNum(d.confirmed)}</td>
                  <td className="px-4 py-2.5 text-right text-xs">{colorNum(d.delivered)}</td>
                  <td className="px-4 py-2.5 text-right text-xs">{colorNum(d.returned, false)}</td>
                  <td className="px-4 py-2.5 text-right text-xs font-medium text-gray-700">{fmt(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UTMTable title="Orders By UTM Medium" data={mediumMap} />
      <UTMTable title="Orders By UTM Campaign" data={campMap} />
    </div>
  )
}
