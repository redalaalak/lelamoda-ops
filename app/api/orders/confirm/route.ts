import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const orderId = formData.get('orderId') as string
    const newStatus = formData.get('status') as string

    const allowed = ['confirmed', 'to_edit', 'canceled_confirmation']
    if (!allowed.includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get current order
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('business_status')
      .eq('id', orderId)
      .single()

    // Update status
    await supabaseAdmin
      .from('orders')
      .update({ business_status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    // Log history
    await supabaseAdmin.from('order_status_history').insert({
      order_id: orderId,
      old_business_status: order?.business_status,
      new_business_status: newStatus,
      changed_by_source: 'user',
      reason: `Agent changed to ${newStatus}`,
    })

    console.log(`[confirm] Order ${orderId} → ${newStatus}`)

    const redirectTo = formData.get('redirect') as string || '/confirmation'
    return NextResponse.redirect(new URL(redirectTo, req.url))
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
