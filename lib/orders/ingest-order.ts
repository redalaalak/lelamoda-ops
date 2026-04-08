import { supabaseAdmin } from '@/lib/supabase/admin';
import { mapShopifyOrder } from '@/lib/shopify/mapper';

export async function ingestShopifyOrder(rawOrder: any) {
  const mapped = mapShopifyOrder(rawOrder);

  const { data: existingOrder } = await supabaseAdmin
    .from('orders')
    .select('id, shopify_order_id')
    .eq('shopify_order_id', mapped.order.shopify_order_id)
    .maybeSingle();

  if (existingOrder) {
    return { ok: true, skipped: true, reason: 'order_already_exists' };
  }

  let customerId: string | null = null;

  if (mapped.customer.shopify_customer_id) {
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id, is_blocked')
      .eq('shopify_customer_id', mapped.customer.shopify_customer_id)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
      await supabaseAdmin
        .from('customers')
        .update({ ...mapped.customer, updated_at: new Date().toISOString() })
        .eq('id', existingCustomer.id);

      mapped.order.blocked_flag = !!existingCustomer.is_blocked;
      if (existingCustomer.is_blocked) mapped.order.business_status = 'blocked_customer';
    }
  }

  if (!customerId && mapped.customer.phone) {
    const { data: phoneCustomer } = await supabaseAdmin
      .from('customers')
      .select('id, is_blocked')
      .eq('phone', mapped.customer.phone)
      .limit(1)
      .maybeSingle();

    if (phoneCustomer) {
      customerId = phoneCustomer.id;
      mapped.order.blocked_flag = !!phoneCustomer.is_blocked;
      if (phoneCustomer.is_blocked) mapped.order.business_status = 'blocked_customer';
    }
  }

  if (!customerId) {
    const { data: createdCustomer, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert(mapped.customer)
      .select('id')
      .single();

    if (customerError) throw customerError;
    customerId = createdCustomer.id;
  }

  const { data: createdOrder, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({ ...mapped.order, customer_id: customerId })
    .select('id, business_status, payment_status, stock_status, shipping_status')
    .single();

  if (orderError) throw orderError;

  if (mapped.items.length > 0) {
    const itemsPayload = mapped.items.map((item: Record<string, unknown>) => ({   ...item,   order_id: createdOrder.id, }));
    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(itemsPayload);
    if (itemsError) throw itemsError;
  }

  const { error: historyError } = await supabaseAdmin.from('order_status_history').insert({
    order_id: createdOrder.id,
    new_business_status: createdOrder.business_status,
    new_payment_status: createdOrder.payment_status,
    new_stock_status: createdOrder.stock_status,
    new_shipping_status: createdOrder.shipping_status,
    changed_by_source: 'shopify_webhook',
    reason: 'Initial order import from Shopify',
  });

  if (historyError) throw historyError;

  return { ok: true, skipped: false, orderId: createdOrder.id };
}
