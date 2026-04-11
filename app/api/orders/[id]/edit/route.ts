import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { logOrderEvent } from '@/lib/orders/logEvent'

/**
 * PATCH /api/orders/[id]/edit
 *
 * Body:
 * {
 *   items: {
 *     id:                 string | null   ← null = new item
 *     shopify_product_id: string | null
 *     shopify_variant_id: string | null
 *     sku:                string | null
 *     title:              string
 *     variant_title:      string | null
 *     quantity:           number
 *     unit_price:         number
 *   }[]
 *   removedItemIds: string[]
 *   shipping_price: number
 *   discount_total: number
 *   actorName?:     string
 * }
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const orderId = params.id

  try {
    const body = await req.json()
    const {
      items          = [],
      removedItemIds = [],
      shipping_price,
      discount_total,
      actorName      = 'user',
    } = body

    console.log(`[edit] orderId=${orderId} items=${items.length} removed=${removedItemIds.length}`)

    // ── 1. Verify order exists ─────────────────────────────────────────────
    const { data: currentOrder, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('subtotal_price, shipping_price, discount_total, total_price')
      .eq('id', orderId)
      .single()

    if (orderErr || !currentOrder) {
      console.error('[edit] order not found:', orderErr?.message)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // ── 2. Snapshot current items (for diff logging) ───────────────────────
    const { data: currentItemRows, error: currentItemsErr } = await supabaseAdmin
      .from('order_items')
      .select('id, title, quantity, unit_price')
      .eq('order_id', orderId)

    if (currentItemsErr) {
      console.error('[edit] failed to fetch current items:', currentItemsErr.message)
      return NextResponse.json({ error: `Failed to load current items: ${currentItemsErr.message}` }, { status: 500 })
    }

    const currentItemMap = new Map(
      (currentItemRows || []).map(i => [i.id, i])
    )

    const pendingLogs: Promise<void>[] = []

    // ── 3. Delete removed items ────────────────────────────────────────────
    for (const itemId of removedItemIds as string[]) {
      const old = currentItemMap.get(itemId)
      const { error: delErr } = await supabaseAdmin
        .from('order_items')
        .delete()
        .eq('id', itemId)

      if (delErr) {
        console.error(`[edit] delete item ${itemId} failed:`, delErr.message)
        // Non-fatal — item might have been deleted already
      } else if (old) {
        pendingLogs.push(logOrderEvent({
          orderId,
          eventType: 'item_removed',
          title: 'Item removed',
          description: old.title,
          actorName,
          source: 'user_action',
          metadata: { item_title: old.title, quantity: old.quantity, unit_price: old.unit_price },
        }))
      }
    }

    // ── 4. Upsert items ────────────────────────────────────────────────────
    let insertedCount = 0
    let updatedCount  = 0

    for (const item of items) {
      const qty       = Number(item.quantity) || 1
      const price     = Number(item.unit_price) || 0
      const lineTotal = qty * price

      if (item.id) {
        // ── UPDATE existing ─────────────────────────────────────────────
        const { error: upErr } = await supabaseAdmin
          .from('order_items')
          .update({
            title:       String(item.title),
            quantity:    qty,
            unit_price:  price,
            total_price: lineTotal,
          })
          .eq('id', item.id)
          .eq('order_id', orderId)   // ← safety: only touch items belonging to this order

        if (upErr) {
          console.error(`[edit] update item ${item.id} failed:`, upErr.message)
          return NextResponse.json({ error: `Failed to update "${item.title}": ${upErr.message}` }, { status: 500 })
        }

        updatedCount++

        const old = currentItemMap.get(item.id)
        if (old) {
          if (old.quantity !== qty) {
            pendingLogs.push(logOrderEvent({
              orderId,
              eventType: 'item_quantity_changed',
              title: 'Quantity changed',
              description: `${item.title}: ${old.quantity} → ${qty}`,
              actorName,
              source: 'user_action',
              metadata: { item_id: item.id, old_qty: old.quantity, new_qty: qty },
            }))
          }
          if (Math.abs(Number(old.unit_price) - price) > 0.001) {
            pendingLogs.push(logOrderEvent({
              orderId,
              eventType: 'item_price_changed',
              title: 'Unit price changed',
              description: `${item.title}: MAD${Number(old.unit_price).toFixed(2)} → MAD${price.toFixed(2)}`,
              actorName,
              source: 'user_action',
              metadata: { item_id: item.id, old_price: old.unit_price, new_price: price },
            }))
          }
        }
      } else {
        // ── INSERT new ──────────────────────────────────────────────────
        // Only include columns that exist in the base schema (01_init.sql).
        // image_url and is_custom require migration 03_order_edit.sql.
        const insertPayload: Record<string, unknown> = {
          order_id:           orderId,
          shopify_product_id: item.shopify_product_id   ? String(item.shopify_product_id)  : null,
          shopify_variant_id: item.shopify_variant_id   ? String(item.shopify_variant_id)  : null,
          sku:                item.sku                  ? String(item.sku)                 : null,
          title:              String(item.title),
          variant_title:      item.variant_title        ? String(item.variant_title)       : null,
          quantity:           qty,
          unit_price:         price,
          total_price:        lineTotal,
        }

        console.log('[edit] inserting item:', JSON.stringify(insertPayload))

        const { error: insErr } = await supabaseAdmin
          .from('order_items')
          .insert(insertPayload)

        if (insErr) {
          console.error('[edit] insert failed:', insErr.message, insErr)
          return NextResponse.json({ error: `Failed to add "${item.title}": ${insErr.message}` }, { status: 500 })
        }

        insertedCount++
        console.log(`[edit] inserted item "${item.title}" OK`)

        pendingLogs.push(logOrderEvent({
          orderId,
          eventType: 'item_added',
          title: item.is_custom ? 'Custom item added' : 'Product added',
          description: String(item.title),
          actorName,
          source: 'user_action',
          metadata: { title: item.title, quantity: qty, unit_price: price },
        }))
      }
    }

    console.log(`[edit] inserted=${insertedCount} updated=${updatedCount}`)

    // ── 5. Re-read items from DB to get authoritative totals ───────────────
    const { data: freshItems, error: freshErr } = await supabaseAdmin
      .from('order_items')
      .select('id, shopify_product_id, shopify_variant_id, sku, title, variant_title, quantity, unit_price, total_price')
      .eq('order_id', orderId)

    if (freshErr) {
      console.error('[edit] freshItems query failed:', freshErr.message)
      return NextResponse.json({ error: `Failed to reload items: ${freshErr.message}` }, { status: 500 })
    }

    console.log(`[edit] freshItems count=${freshItems?.length ?? 0}`)

    const subtotal   = (freshItems || []).reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0)
    const newShip    = Number(shipping_price ?? currentOrder.shipping_price)
    const newDisc    = Number(discount_total  ?? currentOrder.discount_total)
    const total      = subtotal + newShip - newDisc

    // ── 6. Log shipping / discount changes ────────────────────────────────
    if (Math.abs(Number(currentOrder.shipping_price) - newShip) > 0.001) {
      pendingLogs.push(logOrderEvent({
        orderId,
        eventType: 'order_edited',
        title: 'Shipping changed',
        description: `MAD${Number(currentOrder.shipping_price).toFixed(2)} → MAD${newShip.toFixed(2)}`,
        actorName,
        source: 'user_action',
        metadata: { old: currentOrder.shipping_price, new: newShip },
      }))
    }
    if (Math.abs(Number(currentOrder.discount_total) - newDisc) > 0.001) {
      pendingLogs.push(logOrderEvent({
        orderId,
        eventType: 'order_edited',
        title: 'Discount changed',
        description: `MAD${Number(currentOrder.discount_total).toFixed(2)} → MAD${newDisc.toFixed(2)}`,
        actorName,
        source: 'user_action',
        metadata: { old: currentOrder.discount_total, new: newDisc },
      }))
    }

    // ── 7. Persist totals ─────────────────────────────────────────────────
    const { error: totalsErr } = await supabaseAdmin
      .from('orders')
      .update({
        subtotal_price: subtotal,
        shipping_price: newShip,
        discount_total: newDisc,
        total_price:    total,
        amount_due:     total,
        updated_at:     new Date().toISOString(),
      })
      .eq('id', orderId)

    if (totalsErr) {
      console.error('[edit] totals update failed:', totalsErr.message)
      return NextResponse.json({ error: `Failed to save totals: ${totalsErr.message}` }, { status: 500 })
    }

    pendingLogs.push(logOrderEvent({
      orderId,
      eventType: 'order_edited',
      title: 'Order edited',
      description: `Total updated to MAD${total.toFixed(2)}`,
      actorName,
      source: 'user_action',
      metadata: { subtotal, shipping: newShip, discount: newDisc, total, insertedCount, updatedCount },
    }))

    await Promise.all(pendingLogs)

    console.log(`[edit] done — total=MAD${total.toFixed(2)}`)

    return NextResponse.json({
      ok:        true,
      subtotal,
      shipping:  newShip,
      discount:  newDisc,
      total,
      items:     freshItems || [],
      inserted:  insertedCount,
      updated:   updatedCount,
    })

  } catch (err: any) {
    console.error('[edit] unhandled error:', err)
    return NextResponse.json({ error: err.message ?? 'Unexpected server error' }, { status: 500 })
  }
}
