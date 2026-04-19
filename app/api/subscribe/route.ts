import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('subscribers')
    .insert({ email: email.toLowerCase().trim() })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Cet email est déjà inscrit' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
