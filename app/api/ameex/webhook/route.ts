import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const AMEEX_STATUS_TO_BUSINESS: Record<string, string> = {
  DELIVERED: 'delivered',
  RETURNED: 'returned',
  IN_PROGRESS: 'shipped',
  DISTRIBUTION: 'shipped',
  IN_SHIPMENT: 'shipped',
  PICKED_UP: 'shipped',
}

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

    // Update order by ameex_parcel_code
    const update: Record<string, string | null> = {
      ameex_status: statut,
      ameex_status_name: statutName || statut,
    }

    // Auto-update business_status for key statuses
    const businessStatus = AMEEX_STATUS_TO_BUSINESS[statut]
    if (businessStatus) update.business_status = businessStatus

    await supabaseAdmin
      .from('orders')
      .update(update)
      .eq('ameex_parcel_code', code)

    // Log the tracking event
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('ameex_parcel_code', code)
      .single()

    if (order) {
      await supabaseAdmin.from('order_events').insert({
        order_id: order.id,
        event_type: 'ameex_status',
        title: `Ameex: ${statutName || statut}`,
        description: [statutSName, comment].filter(Boolean).join(' — ') || null,
        actor_name: 'Ameex',
        source: 'ameex',
        metadata: { code, statut, statut_s: statutS, statut_s_name: statutSName },
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
