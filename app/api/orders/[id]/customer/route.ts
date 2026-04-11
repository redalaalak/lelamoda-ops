import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { logOrderEvent } from '@/lib/orders/logEvent'

/**
 * PATCH /api/orders/[id]/customer
 *
 * actions:
 *   update_contact   – edit customer name / phone / email
 *   update_shipping  – edit order shipping address fields
 *   link             – change which customer is linked to the order
 *   unlink           – remove customer link
 *   create_and_link  – create new customer then link
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const orderId   = params.id
  const body      = await req.json()
  const { action, actorName = 'user' } = body

  try {
    // ── update_contact ─────────────────────────────────────────────────────
    if (action === 'update_contact') {
      const { firstName, lastName, email, phone } = body
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || null

      // get current linked customer id
      const { data: ord } = await supabaseAdmin
        .from('orders')
        .select('customer_id')
        .eq('id', orderId)
        .single()

      // update customers record if linked
      if (ord?.customer_id) {
        const { error } = await supabaseAdmin
          .from('customers')
          .update({
            first_name: firstName?.trim() || null,
            last_name:  lastName?.trim()  || null,
            full_name:  fullName,
            email:      email?.trim()     || null,
            phone:      phone?.trim()     || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', ord.customer_id)
        if (error) throw error
      }

      // always sync order's embedded fields
      const { error: ordErr } = await supabaseAdmin
        .from('orders')
        .update({
          customer_full_name: fullName,
          customer_phone:     phone?.trim()  || null,
          customer_email:     email?.trim()  || null,
          updated_at:         new Date().toISOString(),
        })
        .eq('id', orderId)
      if (ordErr) throw ordErr

      await logOrderEvent({
        orderId,
        eventType: 'customer_info_updated',
        title:       'Contact information updated',
        description: `${fullName ?? '—'} · ${phone ?? '—'}`,
        actorName,
        source: 'user_action',
      })

      return NextResponse.json({ ok: true })
    }

    // ── update_shipping ────────────────────────────────────────────────────
    if (action === 'update_shipping') {
      const { firstName, lastName, phone, address1, address2, city, province, zip, countryCode } = body

      const { error } = await supabaseAdmin
        .from('orders')
        .update({
          shipping_first_name:  firstName?.trim()    || null,
          shipping_last_name:   lastName?.trim()     || null,
          shipping_phone:       phone?.trim()        || null,
          shipping_address1:    address1?.trim()     || null,
          shipping_address2:    address2?.trim()     || null,
          shipping_city:        city?.trim()         || null,
          shipping_province:    province?.trim()     || null,
          shipping_zip:         zip?.trim()          || null,
          shipping_country_code: countryCode?.trim() || null,
          updated_at:           new Date().toISOString(),
        })
        .eq('id', orderId)
      if (error) throw error

      await logOrderEvent({
        orderId,
        eventType: 'customer_info_updated',
        title:       'Shipping address updated',
        description: [address1, city].filter(Boolean).join(', ') || '—',
        actorName,
        source: 'user_action',
      })

      return NextResponse.json({ ok: true })
    }

    // ── link ───────────────────────────────────────────────────────────────
    if (action === 'link') {
      const { customerId } = body
      const { data: cust, error: ce } = await supabaseAdmin
        .from('customers')
        .select('id, full_name, phone, email')
        .eq('id', customerId)
        .single()
      if (ce || !cust) throw new Error('Customer not found')

      const { error } = await supabaseAdmin
        .from('orders')
        .update({
          customer_id:        cust.id,
          customer_full_name: cust.full_name,
          customer_phone:     cust.phone,
          customer_email:     cust.email,
          updated_at:         new Date().toISOString(),
        })
        .eq('id', orderId)
      if (error) throw error

      await logOrderEvent({
        orderId,
        eventType: 'customer_info_updated',
        title:       'Customer changed',
        description: `Linked to ${cust.full_name ?? cust.phone}`,
        actorName,
        source: 'user_action',
        metadata: { customerId: cust.id },
      })

      return NextResponse.json({ ok: true })
    }

    // ── unlink ─────────────────────────────────────────────────────────────
    if (action === 'unlink') {
      const { error } = await supabaseAdmin
        .from('orders')
        .update({ customer_id: null, updated_at: new Date().toISOString() })
        .eq('id', orderId)
      if (error) throw error

      await logOrderEvent({
        orderId,
        eventType: 'customer_info_updated',
        title:       'Customer removed',
        description: 'Customer unlinked from this order',
        actorName,
        source: 'user_action',
      })

      return NextResponse.json({ ok: true })
    }

    // ── create_and_link ────────────────────────────────────────────────────
    if (action === 'create_and_link') {
      const { firstName, lastName, email, phone, city } = body
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || null

      const { data: newCust, error: ce } = await supabaseAdmin
        .from('customers')
        .insert({
          first_name:   firstName?.trim() || null,
          last_name:    lastName?.trim()  || null,
          full_name:    fullName,
          email:        email?.trim()     || null,
          phone:        phone?.trim()     || null,
          city:         city?.trim()      || null,
          country_code: 'MA',
        })
        .select('id, full_name, phone, email')
        .single()
      if (ce || !newCust) throw new Error(`Failed to create customer: ${ce?.message}`)

      const { error: oe } = await supabaseAdmin
        .from('orders')
        .update({
          customer_id:        newCust.id,
          customer_full_name: newCust.full_name,
          customer_phone:     newCust.phone,
          customer_email:     newCust.email,
          updated_at:         new Date().toISOString(),
        })
        .eq('id', orderId)
      if (oe) throw oe

      await logOrderEvent({
        orderId,
        eventType: 'customer_info_updated',
        title:       'New customer created and linked',
        description: `${newCust.full_name ?? newCust.phone} linked to this order`,
        actorName,
        source: 'user_action',
        metadata: { customerId: newCust.id },
      })

      return NextResponse.json({ ok: true, customerId: newCust.id })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })

  } catch (err: any) {
    console.error('[orders/customer]', err)
    return NextResponse.json({ error: err.message ?? 'Unexpected error' }, { status: 500 })
  }
}
