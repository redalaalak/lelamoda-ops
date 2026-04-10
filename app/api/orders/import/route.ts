import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { recordInitialOrderStatus } from '@/lib/orders/actions'

// Maps common EGROW column names to our fields
const FIELD_MAP: Record<string, string> = {
  // Order
  'order': 'shopify_order_name',
  'order number': 'shopify_order_name',
  'order name': 'shopify_order_name',
  'numéro': 'shopify_order_name',
  'commande': 'shopify_order_name',

  // Customer
  'customer': 'customer_full_name',
  'customer name': 'customer_full_name',
  'nom': 'customer_full_name',
  'nom complet': 'customer_full_name',
  'full name': 'customer_full_name',

  // Phone
  'phone': 'customer_phone',
  'téléphone': 'customer_phone',
  'telephone': 'customer_phone',
  'mobile': 'customer_phone',

  // City
  'city': 'shipping_city',
  'ville': 'shipping_city',

  // Address
  'address': 'shipping_address1',
  'adresse': 'shipping_address1',

  // Province
  'province': 'shipping_province',
  'region': 'shipping_province',
  'région': 'shipping_province',

  // Amount
  'total': 'total_price',
  'amount': 'total_price',
  'montant': 'total_price',
  'prix': 'total_price',
  'price': 'total_price',

  // Payment
  'payment': 'payment_method',
  'payment method': 'payment_method',
  'méthode': 'payment_method',

  // Status
  'status': 'business_status',
  'statut': 'business_status',
  'stage': 'business_status',
  'étape': 'business_status',

  // Products
  'products': 'products_raw',
  'produits': 'products_raw',
  'items': 'products_raw',

  // Date
  'date': 'created_at',
  'created': 'created_at',
  'créé': 'created_at',
}

// Map EGROW status values to our statuses
const STATUS_MAP: Record<string, string> = {
  'pending': 'pending_confirmation',
  'pending_confirmation': 'pending_confirmation',
  'confirmed': 'confirmed',
  'confirmé': 'confirmed',
  'to_edit': 'to_edit',
  'to edit': 'to_edit',
  'à modifier': 'to_edit',
  'canceled': 'canceled_confirmation',
  'cancelled': 'canceled_confirmation',
  'annulé': 'canceled_confirmation',
  'processing': 'processing',
  'en cours': 'processing',
  'shipped': 'shipped',
  'expédié': 'shipped',
  'delivered': 'delivered',
  'livré': 'delivered',
  'returned': 'returned',
  'retourné': 'returned',
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }

  const parseRow = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (line[i] === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += line[i]
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-zàâéèêëîïôùûüç ]/g, '').trim())
  const rows = lines.slice(1).map(line => {
    const vals = parseRow(line)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = vals[i] || '' })
    return row
  })
  return { headers, rows }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const text = await file.text()
    const { headers, rows } = parseCSV(text)

    if (rows.length === 0) return NextResponse.json({ error: 'Empty file or invalid format' }, { status: 400 })

    // Map headers to our field names
    const colMap: Record<string, string> = {}
    headers.forEach(h => {
      const mapped = FIELD_MAP[h]
      if (mapped) colMap[h] = mapped
    })

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    for (const row of rows) {
      try {
        const mapped: Record<string, any> = {
          business_status: 'pending_confirmation',
          payment_status: 'pending',
          stock_status: 'not_checked',
          shipping_status: 'no_parcel',
          currency_code: 'MAD',
        }

        // Map fields
        for (const [col, field] of Object.entries(colMap)) {
          const val = row[col]
          if (!val || val === '—' || val === '-') continue

          if (field === 'business_status') {
            mapped[field] = STATUS_MAP[val.toLowerCase()] || 'pending_confirmation'
          } else if (field === 'total_price') {
            const num = parseFloat(val.replace(/[^0-9.]/g, ''))
            if (!isNaN(num)) { mapped[field] = num; mapped['amount_due'] = num }
          } else if (field === 'created_at') {
            // try parse date
            const d = new Date(val)
            if (!isNaN(d.getTime())) mapped[field] = d.toISOString()
          } else if (field !== 'products_raw') {
            mapped[field] = val
          }
        }

        // Set customer fields from shipping if needed
        if (mapped.customer_full_name) {
          mapped.shipping_first_name = mapped.customer_full_name.split(' ')[0] || ''
          mapped.shipping_last_name = mapped.customer_full_name.split(' ').slice(1).join(' ') || ''
        }
        if (mapped.customer_phone) mapped.shipping_phone = mapped.customer_phone

        // Skip if no identifier
        const orderName = mapped.shopify_order_name
        if (!orderName) { skipped++; continue }

        // Check duplicate
        const { data: existing } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('shopify_order_name', orderName)
          .maybeSingle()

        if (existing) { skipped++; continue }

        // Create or find customer
        let customerId: string | null = null
        if (mapped.customer_phone) {
          const { data: existingCustomer } = await supabaseAdmin
            .from('customers')
            .select('id')
            .eq('phone', mapped.customer_phone)
            .maybeSingle()

          if (existingCustomer) {
            customerId = existingCustomer.id
          } else {
            const { data: newCustomer } = await supabaseAdmin
              .from('customers')
              .insert({
                full_name: mapped.customer_full_name,
                phone: mapped.customer_phone,
                city: mapped.shipping_city,
                country_code: 'MA',
              })
              .select('id')
              .single()
            if (newCustomer) customerId = newCustomer.id
          }
        }

        // Use order name as shopify_order_id if no real ID
        if (!mapped.shopify_order_id) {
          mapped.shopify_order_id = `import_${orderName}_${Date.now()}`
        }

        const { data: createdOrder, error: orderErr } = await supabaseAdmin
          .from('orders')
          .insert({ ...mapped, customer_id: customerId })
          .select('id, business_status, payment_status, stock_status, shipping_status')
          .single()

        if (orderErr) { errors.push(`${orderName}: ${orderErr.message}`); continue }

        // Record initial status history + timeline event
        if (createdOrder) {
          await recordInitialOrderStatus(
            createdOrder.id,
            createdOrder.business_status,
            createdOrder.payment_status,
            createdOrder.stock_status,
            createdOrder.shipping_status,
            'csv_import',
            'Order imported via CSV'
          )
        }
        imported++
      } catch (e: any) {
        errors.push(e.message)
      }
    }

    return NextResponse.json({
      ok: true,
      total: rows.length,
      imported,
      skipped,
      errors: errors.slice(0, 10),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
