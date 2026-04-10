import { supabaseAdmin } from '@/lib/supabase/admin'
import { mapShopifyOrder } from '@/lib/shopify/mapper'
import { fetchProductImage } from '@/lib/shopify/client'

export async function ingestShopifyOrder(rawOrder: any) {
  const mapped = mapShopifyOrder(rawOrder)

  // Check duplicate
  const { data: existing } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('shopify_order_id', mapped.order.shopify_order_id)
    .maybeSingle()

  if (existing) {
    console.log('[ingest] Order already exists, skipping:', mapped.order.shopify_order_id)
    return { ok: true, skipped: true }
  }

  // Create or find customer
  let customerId: string | null = null

  if (mapped.customer.shopify_customer_id) {
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id, is_blocked')
      .eq('shopify_customer_id', mapped.customer.shopify_customer_id)
      .maybeSingle()

    if (existingCustomer) {
      customerId = existingCustomer.id
      if (existingCustomer.is_blocked) {
        mapped.order.blocked_flag = true
        mapped.order.business_status = 'blocked_customer'
      }
    }
  }

  if (!customerId && mapped.customer.phone) {
    const { data: byPhone } = await supabaseAdmin
      .from('customers')
      .select('id, is_blocked')
      .eq('phone', mapped.customer.phone)
      .maybeSingle()

    if (byPhone) {
      customerId = byPhone.id
      if (byPhone.is_blocked) {
        mapped.order.blocked_flag = true
        mapped.order.business_status = 'blocked_customer'
      }
    }
  }

  if (!customerId) {
    const { data: newCustomer, error: customerErr } = await supabaseAdmin
      .from('customers')
      .insert(mapped.customer)
      .select('id')
      .single()

    if (customerErr) throw customerErr
    customerId = newCustomer.id
    console.log('[ingest] Customer created:', customerId)
  }

  // Create order
  const { data: createdOrder, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert({ ...mapped.order, customer_id: customerId })
    .select('id, business_status, payment_status, stock_status, shipping_status')
    .single()

  if (orderErr) throw orderErr
  console.log('[ingest] Order created:', createdOrder.id)

  // Fetch product images and create order items
  if (mapped.items.length > 0) {
    const itemsWithImages = await Promise.all(
      mapped.items.map(async (item: any) => {
        const image_url = item.shopify_product_id
          ? await fetchProductImage(item.shopify_product_id)
          : null
        return { ...item, order_id: createdOrder.id, image_url }
      })
    )
    const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(itemsWithImages)
    if (itemsErr) throw itemsErr
    console.log('[ingest] Items created:', mapped.items.length)
  }

  // Create status history
  await supabaseAdmin.from('order_status_history').insert({
    order_id: createdOrder.id,
    new_business_status: createdOrder.business_status,
    new_payment_status: createdOrder.payment_status,
    new_stock_status: createdOrder.stock_status,
    new_shipping_status: createdOrder.shipping_status,
    changed_by_source: 'shopify_webhook',
    reason: 'Order imported from Shopify',
  })

  return { ok: true, skipped: false, orderId: createdOrder.id }
}
