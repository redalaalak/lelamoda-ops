import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { comment } = await req.json()
    if (!comment?.trim()) return NextResponse.json({ error: 'Empty comment' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('order_status_history')
      .insert({
        order_id: params.id,
        changed_by_source: 'comment',
        reason: comment.trim(),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, entry: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
