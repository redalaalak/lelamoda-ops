import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, total_price, business_status, payment_status, created_at')

  const all = orders || []
  const total = all.length
  const revenue = all.reduce((s, o) => s + Number(o.total_price || 0), 0)
  const pending = all.filter(o => o.business_status === 'pending_confirmation').length
  const confirmed = all.filter(o => o.business_status === 'confirmed').length
  const shipped = all.filter(o => o.business_status === 'shipped').length
  const delivered = all.filter(o => o.business_status === 'delivered').length
  const canceled = all.filter(o => o.business_status === 'canceled_confirmation').length
  const returned = all.filter(o => o.business_status === 'returned').length

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const todayOrders = all.filter(o => new Date(o.created_at) >= today)
  const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total_price || 0), 0)

  const stats = [
    {
      label: 'Total Revenue',
      value: `${revenue.toLocaleString('fr-MA')} DH`,
      sub: `+${todayRevenue.toFixed(0)} DH today`,
      subColor: 'text-emerald-500',
      iconBg: 'bg-emerald-50',
      icon: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Total Orders',
      value: total.toLocaleString(),
      sub: `+${todayOrders.length} today`,
      subColor: 'text-blue-500',
      iconBg: 'bg-blue-50',
      icon: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: 'To Confirm',
      value: pending.toLocaleString(),
      sub: 'Awaiting call',
      subColor: 'text-amber-500',
      iconBg: 'bg-amber-50',
      icon: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Delivered',
      value: delivered.toLocaleString(),
      sub: `${total > 0 ? Math.round((delivered / total) * 100) : 0}% success rate`,
      subColor: 'text-emerald-500',
      iconBg: 'bg-emerald-50',
      icon: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
  ]

  const pipeline = [
    { label: 'Pending', value: pending, color: 'bg-amber-100 text-amber-700', href: '/admin/centers/confirmation' },
    { label: 'Confirmed', value: confirmed, color: 'bg-blue-100 text-blue-700', href: '/admin/centers/processing' },
    { label: 'Shipped', value: shipped, color: 'bg-violet-100 text-violet-700', href: '/admin/centers/shipping' },
    { label: 'Delivered', value: delivered, color: 'bg-emerald-100 text-emerald-700', href: '/admin/centers/delivery' },
    { label: 'Canceled', value: canceled, color: 'bg-red-100 text-red-700', href: '/admin/orders' },
    { label: 'Returned', value: returned, color: 'bg-gray-100 text-gray-600', href: '/admin/centers/return' },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Home</h1>
          <p className="text-sm text-gray-400 mt-0.5">Vue d'ensemble de Tawsilak</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-white border border-gray-100 rounded-lg px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
          <Link
            href="/admin/orders"
            className="px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center gap-1.5"
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Order
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center shrink-0`}>
              {s.icon}
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold text-gray-900 truncate">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
              <div className={`text-xs mt-0.5 ${s.subColor}`}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Order Pipeline</h2>
          <Link href="/admin/orders" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">View all →</Link>
        </div>
        <div className="grid grid-cols-6 gap-3">
          {pipeline.map(p => (
            <Link key={p.label} href={p.href} className="text-center group">
              <div className={`text-2xl font-bold px-3 py-3 rounded-xl ${p.color} group-hover:opacity-80 transition`}>{p.value}</div>
              <div className="text-xs text-gray-400 mt-2">{p.label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick access */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            title: 'Confirmation Center',
            desc: `${pending} orders waiting`,
            href: '/admin/centers/confirmation',
            color: 'border-amber-200',
            badge: 'bg-amber-100 text-amber-700',
            icon: (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            ),
          },
          {
            title: 'Processing Center',
            desc: `${confirmed} orders to process`,
            href: '/admin/centers/processing',
            color: 'border-blue-200',
            badge: 'bg-blue-100 text-blue-700',
            icon: (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            ),
          },
          {
            title: 'Shipping Center',
            desc: `${shipped} orders to ship`,
            href: '/admin/centers/shipping',
            color: 'border-violet-200',
            badge: 'bg-violet-100 text-violet-700',
            icon: (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#8b5cf6" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            ),
          },
        ].map(c => (
          <Link
            key={c.href}
            href={c.href}
            className={`bg-white rounded-xl border ${c.color} p-5 hover:shadow-sm transition group`}
          >
            <div className="flex items-start justify-between mb-4">
              {c.icon}
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gray-300 group-hover:text-gray-400 transition">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-gray-900">{c.title}</div>
            <div className="text-xs text-gray-400 mt-0.5">{c.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
