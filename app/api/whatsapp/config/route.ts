import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const { data } = await supabaseAdmin
    .from('whatsapp_config')
    .select('id, phone_number, display_name, waba_id, phone_number_id, webhook_verify_token, is_active, created_at')
    .eq('is_active', true)
    .single()

  return NextResponse.json({ config: data || null })
}
