import Link from 'next/link'

export default function DraftsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/orders" className="text-gray-400 hover:text-gray-600 transition">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Drafts</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} className="text-gray-300 mb-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm font-medium text-gray-500">No draft orders</p>
        <p className="text-xs text-gray-400 mt-1">Draft orders will appear here</p>
      </div>
    </div>
  )
}
