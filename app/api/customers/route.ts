import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/** GET /api/customers?q=search — search customers */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''

  let query = supabaseAdmin
    .from('customers')
    .select('id, full_name, first_name, last_name, phone, email, city, is_blocked')
    .order('created_at', { ascending: false })
    .limit(25)

  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`
    )
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ customers: data ?? [] })
}

/** POST /api/customers — create customer */
export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, phone, city } = await req.json()
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || null

    const { data, error } = await supabaseAdmin
      .from('customers')
      .insert({
        first_name:   firstName?.trim() || null,
        last_name:    lastName?.trim()  || null,
        full_name:    fullName,
        email:        email?.trim()     || null,
        phone:        phone?.trim()     || null,
        city:         city?.trim()      || null,
        country_code: 'MA',
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: data.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
