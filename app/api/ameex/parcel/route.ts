import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createParcel, deleteParcel, relaunchParcel } from '@/lib/ameex/client'
import { findCityId } from '@/lib/ameex/cities'

// POST — create parcel for an order
export async function POST(req: NextRequest) {
  try {
    const { order_id, city_override, address_override, comment, open } = await req.json()

    if (!order_id) return NextResponse.json({ error: 'order_id required' }, { status: 400 })

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, shopify_order_name, customer_full_name, customer_phone, shipping_phone, shipping_city, shipping_address1, total_price, ameex_parcel_code')
      .eq('id', order_id)
      .single()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.ameex_parcel_code) return NextResponse.json({ error: 'Parcel already created', code: order.ameex_parcel_code }, { status: 400 })

    const city = city_override || order.shipping_city || ''
    const cityId = findCityId(city)
    if (!cityId) return NextResponse.json({ error: `City not found: "${city}". Please select manually.` }, { status: 400 })

    const phone = order.shipping_phone || order.customer_phone || ''
    const address = address_override || order.shipping_address1 || ''

    const result = await createParcel({
      receiver: order.customer_full_name || 'Client',
      phone,
      city: cityId,
      address,
      cod: Math.round(Number(order.total_price || 0)),
      order_num: order.shopify_order_name || order.id,
      comment: comment || '',
      open: open ?? true,
    })

    if (result.login !== 'success' || result.api?.type !== 'success') {
      const msg = result.api?.msg || result.error || 'Ameex API error'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const parcelCode = result.api?.data?.code || result.api?.data?.parcel?.code
    if (!parcelCode) return NextResponse.json({ error: 'No parcel code returned' }, { status: 500 })

    await supabaseAdmin.from('orders').update({
      ameex_parcel_code: parcelCode,
      ameex_status: 'NEW_PARCEL',
      ameex_status_name: 'Nouveau Colis',
    }).eq('id', order_id)

    return NextResponse.json({ ok: true, code: parcelCode })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE — cancel parcel
export async function DELETE(req: NextRequest) {
  try {
    const { order_id, code } = await req.json()
    await deleteParcel(code)
    if (order_id) {
      await supabaseAdmin.from('orders').update({
        ameex_parcel_code: null,
        ameex_status: null,
        ameex_status_name: null,
      }).eq('id', order_id)
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH — relaunch parcel
export async function PATCH(req: NextRequest) {
  try {
    const { code } = await req.json()
    const result = await relaunchParcel(code)
    return NextResponse.json({ ok: true, result })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
