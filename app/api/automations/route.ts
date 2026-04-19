import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const { data } = await supabaseAdmin
    .from('automations')
    .select('*')
    .order('created_at')
  return NextResponse.json({ automations: data || [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, trigger_type, trigger_value, action_type, action_value, action_message } = body
  if (!name || !trigger_type || !trigger_value || !action_type || !action_value) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const { data, error } = await supabaseAdmin.from('automations').insert({
    name, trigger_type, trigger_value, action_type, action_value,
    action_message: action_message || null,
    is_active: true,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ automation: data })
}

export async function PATCH(req: NextRequest) {
  const { id, is_active } = await req.json()
  await supabaseAdmin.from('automations').update({ is_active }).eq('id', id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await supabaseAdmin.from('automations').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
