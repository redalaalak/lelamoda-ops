import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { phone_number_id, waba_id, access_token, phone_number, display_name } = await req.json()

    if (!phone_number_id || !waba_id || !access_token) {
      return NextResponse.json({ error: 'phone_number_id, waba_id, access_token required' }, { status: 400 })
    }

    // Verify the token works
    const verify = await fetch(
      `https://graph.facebook.com/v20.0/${phone_number_id}?fields=verified_name,display_phone_number`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    )
    if (!verify.ok) {
      const err = await verify.json()
      return NextResponse.json({ error: err.error?.message || 'Invalid credentials' }, { status: 400 })
    }
    const phoneData = await verify.json()

    // Deactivate existing config
    await supabaseAdmin.from('whatsapp_config').update({ is_active: false }).eq('is_active', true)

    // Insert new config
    const { error } = await supabaseAdmin.from('whatsapp_config').insert({
      phone_number_id,
      waba_id,
      access_token,
      phone_number: phoneData.display_phone_number || phone_number || '',
      display_name: phoneData.verified_name || display_name || '',
      is_active: true,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      ok: true,
      phone_number: phoneData.display_phone_number,
      display_name: phoneData.verified_name,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE() {
  await supabaseAdmin.from('whatsapp_config').update({ is_active: false }).eq('is_active', true)
  return NextResponse.json({ ok: true })
}
