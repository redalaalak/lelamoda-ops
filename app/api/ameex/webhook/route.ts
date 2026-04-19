import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { runAutomations } from '@/lib/automations/runner'

export async function POST(req: NextRequest) {
  try {
    const text = await req.text()
    const params = new URLSearchParams(text)
    const code = params.get('CODE')
    const statut = params.get('STATUT')
    const statutName = params.get('STATUT_NAME')
    const statutS = params.get('STATUT_S')
    const statutSName = params.get('STATUT_S_NAME')
    const comment = params.get('COMMENT')

    if (!code || !statut) return NextResponse.json({ ok: true })

    // Update ameex tracking fields
    await supabaseAdmin
      .from('orders')
      .update({ ameex_status: statut, ameex_status_name: statutName || statut })
      .eq('ameex_parcel_code', code)

    // Get order
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('ameex_parcel_code', code)
      .single()

    if (order) {
      // Log event
      await supabaseAdmin.from('order_events').insert({
        order_id: order.id,
        event_type: 'ameex_status',
        title: `Ameex: ${statutName || statut}`,
        description: [statutSName, comment].filter(Boolean).join(' — ') || null,
        actor_name: 'Ameex',
        source: 'ameex',
        metadata: { code, statut, statut_s: statutS, statut_s_name: statutSName },
      })

      // Run automations (Ameex status → order status, WhatsApp, etc.)
      await runAutomations('ameex_status', statut, order.id)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
