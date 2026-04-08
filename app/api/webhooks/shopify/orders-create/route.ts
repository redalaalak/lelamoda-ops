import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyShopifyWebhook } from '@/lib/shopify/verify';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ingestShopifyOrder } from '@/lib/orders/ingest-order';

export async function POST(req: Request) {
  const rawBody = await req.text();
  const h = await headers();
  const topic = h.get('x-shopify-topic') || 'orders/create';
  const hmac = h.get('x-shopify-hmac-sha256');
  const shopDomain = h.get('x-shopify-shop-domain');

  const isValid = verifyShopifyWebhook(rawBody, hmac);
  if (!isValid) {
    return new NextResponse('Invalid webhook signature', { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  const { error: logError } = await supabaseAdmin.from('webhook_events').insert({
    source: 'shopify',
    event_name: topic,
    external_id: payload?.id ? String(payload.id) : null,
    payload,
    processed: false,
  });

  if (logError) console.error('webhook log insert error', logError);

  try {
    const result = await ingestShopifyOrder(payload);

    await supabaseAdmin
      .from('webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('external_id', payload?.id ? String(payload.id) : '')
      .eq('source', 'shopify');

    return NextResponse.json({ ok: true, shop: shopDomain, result });
  } catch (error: any) {
    await supabaseAdmin
      .from('webhook_events')
      .update({ error_message: error?.message || 'Unknown error' })
      .eq('external_id', payload?.id ? String(payload.id) : '')
      .eq('source', 'shopify');

    return NextResponse.json({ ok: false, error: error?.message || 'Webhook processing failed' }, { status: 500 });
  }
}
