import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { order_id, phone, message, template_name, template_params } = await req.json()

    if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 })

    const { data: config } = await supabaseAdmin
      .from('whatsapp_config')
      .select('*')
      .eq('is_active', true)
      .single()

    if (!config) return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 400 })

    // Normalize phone: 0612345678 → 212612345678
    let to = phone.replace(/\s+/g, '').replace(/^0/, '212').replace(/^\+/, '')

    let waBody: any

    if (template_name) {
      // Template message (for first contact or 24h+ since last message)
      waBody = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: template_name,
          language: { code: 'ar' },
          components: template_params ? [{
            type: 'body',
            parameters: template_params.map((p: string) => ({ type: 'text', text: p })),
          }] : [],
        },
      }
    } else if (message) {
      // Free-form text (only within 24h window)
      waBody = {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }
    } else {
      return NextResponse.json({ error: 'message or template_name required' }, { status: 400 })
    }

    const res = await fetch(
      `https://graph.facebook.com/v20.0/${config.phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.access_token}`,
        },
        body: JSON.stringify(waBody),
      }
    )

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || 'WhatsApp API error' }, { status: 400 })
    }

    const wa_message_id = data.messages?.[0]?.id

    await supabaseAdmin.from('whatsapp_messages').insert({
      order_id: order_id || null,
      customer_phone: to,
      direction: 'outbound',
      message_type: template_name ? 'template' : 'text',
      template_name: template_name || null,
      content: message || `Template: ${template_name}`,
      wa_message_id,
      status: 'sent',
    })

    return NextResponse.json({ ok: true, wa_message_id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
