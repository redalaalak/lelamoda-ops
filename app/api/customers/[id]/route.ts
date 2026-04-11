import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/** GET /api/customers/[id] — customer + order stats */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { data: customer, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, shopify_order_name, total_price, business_status, created_at')
    .eq('customer_id', params.id)
    .order('created_at', { ascending: false })

  const all        = orders ?? []
  const totalSpent = all.reduce((s, o) => s + Number(o.total_price ?? 0), 0)

  return NextResponse.json({
    customer,
    orders: all,
    stats: {
      totalOrders:  all.length,
      confirmed:    all.filter(o => o.business_status === 'confirmed').length,
      delivered:    all.filter(o => o.business_status === 'delivered').length,
      returned:     all.filter(o => o.business_status === 'returned').length,
      totalSpent,
    },
  })
}

/** PATCH /api/customers/[id] — update customer fields */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    const { error } = await supabaseAdmin
      .from('customers')
      .update({
        first_name:   body.first_name   ?? undefined,
        last_name:    body.last_name    ?? undefined,
        full_name:    body.full_name    ?? undefined,
        email:        body.email        ?? undefined,
        phone:        body.phone        ?? undefined,
        city:         body.city         ?? undefined,
        country_code: body.country_code ?? undefined,
        updated_at:   new Date().toISOString(),
      })
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
