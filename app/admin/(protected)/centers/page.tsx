import Link from 'next/link'

export const dynamic = 'force-dynamic'

const centers = [
  {
    label: 'Confirmation',
    href: '/admin/centers/confirmation',
    desc: 'Confirm and validate orders',
    color: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-500',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Processing',
    href: '/admin/centers/processing',
    desc: 'Prepare and pack orders for shipment',
    color: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-500',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
  },
  {
    label: 'Shipping',
    href: '/admin/centers/shipping',
    desc: 'Manage shipments and track parcels',
    color: 'bg-violet-50 border-violet-200',
    iconColor: 'text-violet-500',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
  },
  {
    label: 'Delivery',
    href: '/admin/centers/delivery',
    desc: 'Update delivery and update statuses',
    color: 'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-500',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Follow Up',
    href: '/admin/centers/follow-up',
    desc: 'Follow up on pending and unreachable orders',
    color: 'bg-orange-50 border-orange-200',
    iconColor: 'text-orange-500',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  {
    label: 'Return & Exchange',
    href: '/admin/centers/return',
    desc: 'Handle returns and exchange requests',
    color: 'bg-red-50 border-red-200',
    iconColor: 'text-red-500',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
    ),
  },
  {
    label: 'Out Of Stock',
    href: '/admin/centers/out-of-stock',
    desc: 'Manage orders with unavailable items',
    color: 'bg-gray-50 border-gray-200',
    iconColor: 'text-gray-500',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
]

export default function CentersPage() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-gray-900 mb-5">Centers</h1>
      <div className="grid grid-cols-3 gap-4">
        {centers.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`block p-5 rounded-xl border ${c.color} hover:shadow-sm transition-shadow group`}
          >
            <div className={`mb-3 ${c.iconColor}`}>{c.icon}</div>
            <div className="font-semibold text-gray-900 mb-1">{c.label}</div>
            <div className="text-xs text-gray-500">{c.desc}</div>
            <div className="mt-3 flex items-center gap-1 text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
              Open center
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
