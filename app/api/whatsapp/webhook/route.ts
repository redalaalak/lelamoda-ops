import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// GET — Meta webhook verification
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const mode = sp.get('hub.mode')
  const token = sp.get('hub.verify_token')
  const challenge = sp.get('hub.challenge')

  const { data: config } = await supabaseAdmin
    .from('whatsapp_config')
    .select('webhook_verify_token')
    .eq('is_active', true)
    .single()

  if (mode === 'subscribe' && config && token === config.webhook_verify_token) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

// POST — receive incoming WhatsApp messages
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    if (!value) return NextResponse.json({ ok: true })

    const messages = value.messages || []
    const contacts = value.contacts || []

    for (const msg of messages) {
      const from = msg.from // phone number e.g. "212600000000"
      const text = msg.text?.body || msg.type
      const contact = contacts.find((c: any) => c.wa_id === from)
      const name = contact?.profile?.name || from

      // Find matching order by customer phone
      const phone = from.startsWith('212') ? '0' + from.slice(3) : from
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id')
        .or(`customer_phone.eq.${phone},customer_phone.eq.+${from}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      await supabaseAdmin.from('whatsapp_messages').insert({
        order_id: order?.id || null,
        customer_phone: from,
        customer_name: name,
        direction: 'inbound',
        message_type: msg.type,
        content: text,
        wa_message_id: msg.id,
        status: 'received',
      })
    }

    // Handle status updates
    const statuses = value.statuses || []
    for (const s of statuses) {
      await supabaseAdmin
        .from('whatsapp_messages')
        .update({ status: s.status })
        .eq('wa_message_id', s.id)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
