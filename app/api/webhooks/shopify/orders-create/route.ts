import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    await supabaseAdmin.from('webhook_events').insert({
      source: 'shopify',
      event_name: 'orders/create',
      payload: { raw: rawBody },
      processed: false,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('WEBHOOK ERROR:', error);
    return NextResponse.json({ ok: false, error: 'webhook_failed' }, { status: 500 });
  }
}
