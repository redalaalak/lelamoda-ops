import Link from 'next/link'

export default function AbandonedCartsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/orders" className="text-gray-400 hover:text-gray-600 transition">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Abandoned Carts</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} className="text-gray-300 mb-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-sm font-medium text-gray-500">No abandoned carts</p>
        <p className="text-xs text-gray-400 mt-1">Requires Shopify abandoned checkout webhook</p>
      </div>
    </div>
  )
}
