import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const status = url.searchParams.get('status')

  let query = supabaseAdmin
    .from('orders')
    .select('*, order_items(title, variant_title, quantity, unit_price, sku)')
    .order('created_at', { ascending: false })

  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to + 'T23:59:59')
  if (status) query = query.eq('business_status', status)

  const { data: orders } = await query

  if (!orders) return NextResponse.json({ error: 'No data' }, { status: 500 })

  const headers = [
    'Order Number', 'Date', 'Customer Name', 'Phone', 'Email',
    'City', 'Province', 'Address', 'Zip',
    'Products', 'Subtotal', 'Discount', 'Shipping', 'Total',
    'Payment Method', 'Payment Status', 'Business Status',
    'UTM Source', 'UTM Medium', 'UTM Campaign',
  ]

  const rows = orders.map(o => {
    const products = (o.order_items || [])
      .map((i: any) => `${i.title}${i.variant_title ? ` (${i.variant_title})` : ''} x${i.quantity}`)
      .join(' | ')

    const escape = (v: any) => {
      if (v == null) return ''
      const s = String(v)
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"` : s
    }

    return [
      o.shopify_order_name || o.shopify_order_number,
      o.created_at ? new Date(o.created_at).toLocaleDateString('fr-MA') : '',
      o.customer_full_name,
      o.customer_phone,
      o.customer_email,
      o.shipping_city,
      o.shipping_province,
      o.shipping_address1,
      o.shipping_zip,
      products,
      o.subtotal_price,
      o.discount_total,
      o.shipping_price,
      o.total_price,
      o.payment_method,
      o.payment_status,
      o.business_status,
      (o as any).utm_source,
      (o as any).utm_medium,
      (o as any).utm_campaign,
    ].map(escape).join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  const bom = '\uFEFF' // UTF-8 BOM for Excel

  return new NextResponse(bom + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().slice(0,10)}.csv"`,
    },
  })
}
