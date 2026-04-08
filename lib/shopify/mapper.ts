type ShopifyOrder = any;

export function mapShopifyOrder(order: ShopifyOrder) {
  const shipping = order.shipping_address || {};
  const customer = order.customer || {};
  const customerPhone = shipping.phone || customer.phone || order.phone || null;

  const firstName = customer.first_name || shipping.first_name || '';
  const lastName = customer.last_name || shipping.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || order.contact_email || 'Unknown Customer';

  return {
    customer: {
      shopify_customer_id: customer?.id ? String(customer.id) : null,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      email: customer.email || order.email || null,
      phone: customerPhone,
      whatsapp_phone: customerPhone,
      city: shipping.city || null,
      country_code: shipping.country_code || 'MA',
    },
    order: {
      shopify_order_id: String(order.id),
      shopify_order_number: order.order_number ? String(order.order_number) : null,
      shopify_order_name: order.name || null,
      business_status: 'pending_confirmation',
      payment_status: 'pending',
      stock_status: 'not_checked',
      shipping_status: 'no_parcel',
      duplicate_flag: false,
      blocked_flag: false,
      currency_code: order.currency || 'MAD',
      subtotal_price: Number(order.current_subtotal_price || 0),
      discount_total: Number(order.current_total_discounts || 0),
      shipping_price: Number(order.total_shipping_price_set?.shop_money?.amount || 0),
      total_price: Number(order.current_total_price || 0),
      amount_due: Number(order.current_total_price || 0),
      payment_method: order.gateway || 'COD',
      customer_note: order.note || null,
      customer_full_name: fullName,
      customer_phone: customerPhone,
      customer_email: customer.email || order.email || null,
      shipping_first_name: shipping.first_name || null,
      shipping_last_name: shipping.last_name || null,
      shipping_phone: shipping.phone || customerPhone,
      shipping_address1: shipping.address1 || null,
      shipping_address2: shipping.address2 || null,
      shipping_city: shipping.city || null,
      shipping_province: shipping.province || null,
      shipping_zip: shipping.zip || null,
      shipping_country_code: shipping.country_code || 'MA',
    },
    items: (order.line_items || []).map((item: any) => ({
      shopify_line_item_id: item.id ? String(item.id) : null,
      shopify_product_id: item.product_id ? String(item.product_id) : null,
      shopify_variant_id: item.variant_id ? String(item.variant_id) : null,
      sku: item.sku || null,
      title: item.title || '',
      variant_title: item.variant_title || null,
      quantity: Number(item.quantity || 1),
      unit_price: Number(item.price || 0),
      total_price: Number(item.price || 0) * Number(item.quantity || 1),
    })),
  };
}
