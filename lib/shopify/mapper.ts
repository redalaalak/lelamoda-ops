function extractUTM(landingSite: string | null) {
  if (!landingSite) return {}
  try {
    const url = new URL('https://x.com' + landingSite)
    return {
      utm_source: url.searchParams.get('utm_source') || null,
      utm_medium: url.searchParams.get('utm_medium') || null,
      utm_campaign: url.searchParams.get('utm_campaign') || null,
      utm_content: url.searchParams.get('utm_content') || null,
      utm_term: url.searchParams.get('utm_term') || null,
      landing_site: landingSite,
    }
  } catch {
    return { landing_site: landingSite }
  }
}

export function mapShopifyOrder(order: any) {
  const shipping = order.shipping_address || {}
  const customer = order.customer || {}

  const phone =
    shipping.phone ||
    customer.phone ||
    order.phone ||
    null

  const firstName = customer.first_name || shipping.first_name || ''
  const lastName = customer.last_name || shipping.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim() || order.email || 'Unknown'

  const utm = extractUTM(order.landing_site || null)

  return {
    customer: {
      shopify_customer_id: customer?.id ? String(customer.id) : null,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      email: customer.email || order.email || null,
      phone,
      whatsapp_phone: phone,
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
      subtotal_price: parseFloat(order.current_subtotal_price || '0'),
      discount_total: parseFloat(order.current_total_discounts || '0'),
      shipping_price: parseFloat(order.total_shipping_price_set?.shop_money?.amount || '0'),
      total_price: parseFloat(order.current_total_price || '0'),
      amount_due: parseFloat(order.current_total_price || '0'),
      payment_method: order.gateway || 'COD',

      customer_note: order.note || null,
      customer_full_name: fullName,
      customer_phone: phone,
      customer_email: customer.email || order.email || null,

      shipping_first_name: shipping.first_name || null,
      shipping_last_name: shipping.last_name || null,
      shipping_phone: shipping.phone || phone,
      shipping_address1: shipping.address1 || null,
      shipping_address2: shipping.address2 || null,
      shipping_city: shipping.city || null,
      shipping_province: shipping.province || null,
      shipping_zip: shipping.zip || null,
      shipping_country_code: shipping.country_code || 'MA',

      ...utm,
    },
    items: (order.line_items || []).map((item: any) => ({
      shopify_line_item_id: item.id ? String(item.id) : null,
      shopify_product_id: item.product_id ? String(item.product_id) : null,
      shopify_variant_id: item.variant_id ? String(item.variant_id) : null,
      sku: item.sku || null,
      title: item.title || '',
      variant_title: item.variant_title || null,
      quantity: Number(item.quantity || 1),
      unit_price: parseFloat(item.price || '0'),
      total_price: parseFloat(item.price || '0') * Number(item.quantity || 1),
    })),
  }
}
