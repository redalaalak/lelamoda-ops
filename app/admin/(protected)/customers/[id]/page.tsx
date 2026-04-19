import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound }       from 'next/navigation'
import Link               from 'next/link'
import { STATUS_COLOR, STATUS_LABEL } from '@/lib/orders/constants'

export const dynamic = 'force-dynamic'

export default async function CustomerProfilePage({
  params,
}: {
  params: { id: string }
}) {
  // ── Load customer ───────────────────────────────────────────────────────
  const { data: customer, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !customer) notFound()

  // ── Load orders ─────────────────────────────────────────────────────────
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, shopify_order_name, shopify_order_number, total_price, business_status, payment_status, created_at, order_items(title, image_url)')
    .eq('customer_id', params.id)
    .order('created_at', { ascending: false })

  const all = orders ?? []

  // ── Lifetime stats ──────────────────────────────────────────────────────
  const totalOrders  = all.length
  const totalSpent   = all.reduce((s, o) => s + Number(o.total_price ?? 0), 0)
  const confirmed    = all.filter(o => o.business_status === 'confirmed').length
  const delivered    = all.filter(o => o.business_status === 'delivered').length
  const returned     = all.filter(o => o.business_status === 'returned').length

  const initials = (name: string | null) => {
    if (!name?.trim()) return '?'
    const p = name.trim().split(/\s+/)
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : p[0].slice(0, 2).toUpperCase()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
        <Link href="/customers" className="hover:text-gray-600 transition">Customers</Link>
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-700 font-medium">{customer.full_name ?? customer.phone ?? 'Customer'}</span>
      </div>

      {/* ── Hero row ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold shrink-0">
          {initials(customer.full_name)}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{customer.full_name ?? '(no name)'}</h1>
          <div className="flex items-center gap-2 mt-1">
            {customer.is_blocked ? (
              <span className="text-xs font-medium px-2 py-0.5 bg-red-100 text-red-700 rounded-lg">Blocked</span>
            ) : (
              <span className="text-xs font-medium px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg">Active</span>
            )}
            <span className="text-xs text-gray-400">
              Customer since {new Date(customer.created_at).toLocaleDateString('fr-MA', { dateStyle: 'long' })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">

        {/* ── LEFT: Profile + Contact ────────────────────────────────── */}
        <div className="col-span-2 space-y-4">

          {/* Profile card */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-sm text-gray-900 mb-4">Profile</h2>

            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <div className="text-xs font-medium text-gray-400 mb-0.5">First name</div>
                <div className="text-gray-800">{customer.first_name || '—'}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-400 mb-0.5">Last name</div>
                <div className="text-gray-800">{customer.last_name || '—'}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-400 mb-0.5">Phone</div>
                <div className="text-gray-800">{customer.phone || '—'}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-400 mb-0.5">WhatsApp</div>
                <div className="text-gray-800">{customer.whatsapp_phone || customer.phone || '—'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs font-medium text-gray-400 mb-0.5">Email</div>
                <div className="text-gray-800">{customer.email || '—'}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-400 mb-0.5">City</div>
                <div className="text-gray-800">{customer.city || '—'}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-400 mb-0.5">Country</div>
                <div className="text-gray-800">{customer.country_code || 'MA'}</div>
              </div>
            </div>

            {/* Quick actions */}
            {customer.phone && (
              <div className="flex gap-2 mt-5 pt-4 border-t border-gray-50">
                <a
                  href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#16a34a">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.104.544 4.078 1.5 5.797L0 24l6.386-1.478A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.866 9.866 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374A9.847 9.847 0 012.118 12C2.118 6.534 6.534 2.118 12 2.118S21.882 6.534 21.882 12 17.466 21.882 12 21.882z"/>
                  </svg>
                  WhatsApp
                </a>
                <a
                  href={`tel:${customer.phone}`}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                >
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call
                </a>
              </div>
            )}
          </div>

          {/* Orders table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-sm text-gray-900">Orders</h2>
              <span className="text-xs text-gray-400">{totalOrders} total</span>
            </div>

            {all.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">No orders found for this customer.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {all.map(o => {
                  const item = (o.order_items as any[])?.[0]
                  return (
                    <Link
                      key={o.id}
                      href={`/orders/${o.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition"
                    >
                      {/* thumbnail */}
                      {item?.image_url ? (
                        <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-gray-300 text-base">📦</div>
                      )}

                      {/* order info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900">
                          {o.shopify_order_name || `#${o.shopify_order_number}` || o.id.slice(0, 8)}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(o.created_at).toLocaleDateString('fr-MA', { dateStyle: 'medium' })}
                        </div>
                      </div>

                      {/* status + total */}
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-gray-900 mb-0.5">
                          MAD {Number(o.total_price ?? 0).toFixed(2)}
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${STATUS_COLOR[o.business_status] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABEL[o.business_status] || o.business_status}
                        </span>
                      </div>

                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gray-300 shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* ── RIGHT: Stats ────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Lifetime stats */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-sm text-gray-900 mb-4">Lifetime Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Total orders</span>
                <span className="text-sm font-bold text-gray-900">{totalOrders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Confirmed</span>
                <span className="text-sm font-semibold text-emerald-600">{confirmed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Delivered</span>
                <span className="text-sm font-semibold text-teal-600">{delivered}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Returned</span>
                <span className="text-sm font-semibold text-red-500">{returned}</span>
              </div>
              <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-500">Total spent</span>
                <span className="text-sm font-bold text-gray-900">MAD {totalSpent.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes placeholder */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-sm text-gray-900 mb-3">Notes</h2>
            <p className="text-xs text-gray-400 italic">No notes yet.</p>
          </div>

        </div>
      </div>
    </div>
  )
}
