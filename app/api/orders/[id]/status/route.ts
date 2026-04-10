import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const VALID_STATUSES = [
  'pending_confirmation', 'confirmed', 'to_edit', 'canceled_confirmation',
  'processing', 'shipped', 'delivered', 'returned', 'blocked_customer', 'out_of_stock',
]

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { status, reason } = await req.json()
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('business_status')
      .eq('id', params.id)
      .single()

    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await supabaseAdmin
      .from('orders')
      .update({ business_status: status, updated_at: new Date().toISOString() })
      .eq('id', params.id)

    await supabaseAdmin.from('order_status_history').insert({
      order_id: params.id,
      old_business_status: order.business_status,
      new_business_status: status,
      changed_by_source: 'user',
      reason: reason || null,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
