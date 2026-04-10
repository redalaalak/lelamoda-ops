import { supabaseAdmin } from '@/lib/supabase/admin'
import { VALID_BUSINESS_STATUSES, STATUS_LABEL } from './constants'
import { logOrderEvent } from './logEvent'

/**
 * Central mutation layer — all order mutations go through here.
 * Every call automatically writes to order_status_history (legacy)
 * AND to order_events (new unified timeline).
 */

// ---------------------------------------------------------------------------
// Business status
// ---------------------------------------------------------------------------
export async function moveOrderBusinessStatus(
  orderId: string,
  newStatus: string,
  source: string = 'user_action',
  reason?: string,
  actorName?: string
) {
  if (!VALID_BUSINESS_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid business status: ${newStatus}`)
  }

  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('orders')
    .select('business_status')
    .eq('id', orderId)
    .single()

  if (fetchErr || !order) throw new Error('Order not found')

  // No-op if same status
  if (order.business_status === newStatus) return { ok: true, changed: false }

  const { error: updateErr } = await supabaseAdmin
    .from('orders')
    .update({ business_status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (updateErr) throw updateErr

  // Legacy history record
  await supabaseAdmin.from('order_status_history').insert({
    order_id: orderId,
    old_business_status: order.business_status,
    new_business_status: newStatus,
    changed_by_source: source,
    reason: reason || null,
  })

  // New unified event
  const oldLabel = STATUS_LABEL[order.business_status] || order.business_status
  const newLabel = STATUS_LABEL[newStatus] || newStatus
  await logOrderEvent({
    orderId,
    eventType: 'business_status_changed',
    title: 'Business status changed',
    description: `${oldLabel} → ${newLabel}`,
    actorName: actorName ?? resolveActorName(source),
    source,
    metadata: {
      old_status: order.business_status,
      new_status: newStatus,
      reason: reason ?? null,
    },
  })

  return { ok: true, changed: true, from: order.business_status, to: newStatus }
}

// ---------------------------------------------------------------------------
// Payment status
// ---------------------------------------------------------------------------
export async function updateOrderPaymentStatus(
  orderId: string,
  newStatus: 'pending' | 'paid' | 'refunded',
  source: string = 'user_action',
  reason?: string,
  actorName?: string
) {
  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('orders')
    .select('payment_status')
    .eq('id', orderId)
    .single()

  if (fetchErr || !order) throw new Error('Order not found')

  const { error: updateErr } = await supabaseAdmin
    .from('orders')
    .update({ payment_status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (updateErr) throw updateErr

  // Legacy history record
  await supabaseAdmin.from('order_status_history').insert({
    order_id: orderId,
    old_payment_status: order.payment_status,
    new_payment_status: newStatus,
    changed_by_source: source,
    reason: reason || `Payment status changed to ${newStatus}`,
  })

  // New unified event
  const payLabel: Record<string, string> = { pending: 'COD — Not Yet Paid', paid: 'Paid', refunded: 'Refunded' }
  await logOrderEvent({
    orderId,
    eventType: 'payment_status_changed',
    title: 'Payment status changed',
    description: `${payLabel[order.payment_status] ?? order.payment_status} → ${payLabel[newStatus] ?? newStatus}`,
    actorName: actorName ?? resolveActorName(source),
    source,
    metadata: {
      old_status: order.payment_status,
      new_status: newStatus,
      reason: reason ?? null,
    },
  })

  return { ok: true, from: order.payment_status, to: newStatus }
}

// ---------------------------------------------------------------------------
// Notes / comments
// ---------------------------------------------------------------------------
export async function addOrderNote(
  orderId: string,
  note: string,
  source: string = 'user_action',
  actorName?: string
) {
  if (!note?.trim()) throw new Error('Note cannot be empty')

  // Legacy history record (kept for backward compat)
  await supabaseAdmin.from('order_status_history').insert({
    order_id: orderId,
    changed_by_source: 'comment',
    reason: note.trim(),
  })

  // New unified event — return it so the UI can append optimistically
  const { data: event, error } = await supabaseAdmin
    .from('order_events')
    .insert({
      order_id:   orderId,
      event_type: 'note_added',
      title:      'Note added',
      description: note.trim(),
      actor_name: actorName ?? resolveActorName(source),
      source,
    })
    .select()
    .single()

  if (error) throw error
  return { ok: true, entry: event }
}

// ---------------------------------------------------------------------------
// Initial order status (called on creation)
// ---------------------------------------------------------------------------
export async function recordInitialOrderStatus(
  orderId: string,
  businessStatus: string,
  paymentStatus: string,
  stockStatus: string,
  shippingStatus: string,
  source: string,
  reason: string,
  actorName?: string
) {
  // Legacy history record
  await supabaseAdmin.from('order_status_history').insert({
    order_id: orderId,
    new_business_status: businessStatus,
    new_payment_status: paymentStatus,
    new_stock_status: stockStatus,
    new_shipping_status: shippingStatus,
    changed_by_source: source,
    reason,
  })

  // New unified event
  const isShopify = source === 'shopify_webhook'
  const isCsv = source === 'csv_import'
  await logOrderEvent({
    orderId,
    eventType: isShopify ? 'order_imported' : isCsv ? 'order_imported' : 'order_created',
    title: isShopify
      ? 'Order imported from Shopify'
      : isCsv
      ? 'Order imported via CSV'
      : 'Order created',
    description: reason !== 'Order created' ? reason : undefined,
    actorName: actorName ?? resolveActorName(source),
    source,
    metadata: {
      business_status: businessStatus,
      payment_status: paymentStatus,
      stock_status: stockStatus,
      shipping_status: shippingStatus,
    },
  })

  return { ok: true }
}

// ---------------------------------------------------------------------------
// Internal helper — map source string to display name
// ---------------------------------------------------------------------------
function resolveActorName(source: string): string {
  const map: Record<string, string> = {
    user_action:          'user',
    user:                 'user',
    system:               'system',
    shopify_webhook:      'shopify_webhook',
    automation:           'automation',
    shipping_integration: 'shipping_integration',
    csv_import:           'csv_import',
    comment:              'user',
  }
  return map[source] ?? source
}
