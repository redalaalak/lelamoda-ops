import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ingestShopifyOrder } from '@/lib/orders/ingest'

export async function POST(req: Request) {
  console.log('[webhook] Shopify order received')

  try {
    const rawBody = await req.text()
    console.log('[webhook] Raw body length:', rawBody.length)

    // Log raw webhook event
    await supabaseAdmin.from('webhook_events').insert({
      source: 'shopify',
      event_name: 'orders/create',
      external_id: null,
      payload: JSON.parse(rawBody),
      processed: false,
    })

    console.log('[webhook] webhook_events inserted')

    // Parse and ingest order
    const order = JSON.parse(rawBody)
    const result = await ingestShopifyOrder(order)

    console.log('[webhook] Ingest result:', result)

    // Mark as processed
    await supabaseAdmin
      .from('webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('source', 'shopify')
      .eq('event_name', 'orders/create')
      .is('processed_at', null)

    return NextResponse.json({ ok: true, result })
  } catch (err: any) {
    console.error('[webhook] ERROR:', err?.message || err)
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 })
  }
}
