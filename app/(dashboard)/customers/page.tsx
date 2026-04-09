import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CustomersPage() {
  const { data: customers, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
        <div className="text-sm text-slate-500">{customers?.length || 0} customers</div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          Error: {error.message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Phone</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">City</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Since</th>
            </tr>
          </thead>
          <tbody>
            {!customers || customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                  No customers yet.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm text-slate-900">{c.full_name}</div>
                    <div className="text-xs text-slate-400">{c.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{c.phone}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{c.city || '—'}</td>
                  <td className="px-4 py-3">
                    {c.is_blocked ? (
                      <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-medium bg-red-100 text-red-700">Blocked</span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-medium bg-green-100 text-green-700">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(c.created_at).toLocaleDateString('fr-MA')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
