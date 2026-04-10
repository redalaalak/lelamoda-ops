import { supabaseAdmin } from '@/lib/supabase/admin'
import { VALID_BUSINESS_STATUSES } from './constants'

/**
 * Central mutation layer — all order status changes go through here.
 * Every call automatically creates an order_status_history record.
 */

export async function moveOrderBusinessStatus(
  orderId: string,
  newStatus: string,
  source: string = 'user',
  reason?: string
) {
  if (!VALID_BUSINESS_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid business status: ${newStatus}`)
  }

  // Fetch current status
  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('orders')
    .select('business_status')
    .eq('id', orderId)
    .single()

  if (fetchErr || !order) throw new Error('Order not found')

  // No-op if same status
  if (order.business_status === newStatus) return { ok: true, changed: false }

  // Update order
  const { error: updateErr } = await supabaseAdmin
    .from('orders')
    .update({ business_status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (updateErr) throw updateErr

  // Create history record
  const { error: historyErr } = await supabaseAdmin
    .from('order_status_history')
    .insert({
      order_id: orderId,
      old_business_status: order.business_status,
      new_business_status: newStatus,
      changed_by_source: source,
      reason: reason || null,
    })

  if (historyErr) throw historyErr

  return { ok: true, changed: true, from: order.business_status, to: newStatus }
}

export async function updateOrderPaymentStatus(
  orderId: string,
  newStatus: 'pending' | 'paid' | 'refunded',
  source: string = 'user',
  reason?: string
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

  // Log in history
  const { error: historyErr } = await supabaseAdmin
    .from('order_status_history')
    .insert({
      order_id: orderId,
      old_payment_status: order.payment_status,
      new_payment_status: newStatus,
      changed_by_source: source,
      reason: reason || `Payment status changed to ${newStatus}`,
    })

  if (historyErr) throw historyErr

  return { ok: true, from: order.payment_status, to: newStatus }
}

export async function addOrderNote(
  orderId: string,
  note: string,
  source: string = 'user'
) {
  if (!note?.trim()) throw new Error('Note cannot be empty')

  const { data, error } = await supabaseAdmin
    .from('order_status_history')
    .insert({
      order_id: orderId,
      changed_by_source: 'comment',
      reason: note.trim(),
    })
    .select()
    .single()

  if (error) throw error
  return { ok: true, entry: data }
}

export async function recordInitialOrderStatus(
  orderId: string,
  businessStatus: string,
  paymentStatus: string,
  stockStatus: string,
  shippingStatus: string,
  source: string,
  reason: string
) {
  const { error } = await supabaseAdmin
    .from('order_status_history')
    .insert({
      order_id: orderId,
      new_business_status: businessStatus,
      new_payment_status: paymentStatus,
      new_stock_status: stockStatus,
      new_shipping_status: shippingStatus,
      changed_by_source: source,
      reason,
    })

  if (error) throw error
  return { ok: true }
}
