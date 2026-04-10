import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { logOrderEvent } from '@/lib/orders/logEvent'

interface SubmittedItem {
  id: string | null          // null → new item to insert
  shopify_product_id?: string | null
  shopify_variant_id?: string | null
  sku?: string | null
  title: string
  variant_title?: string | null
  quantity: number
  unit_price: number
  image_url?: string | null
  is_custom?: boolean
}

/**
 * PATCH /api/orders/[id]/edit
 *
 * Body:
 * {
 *   items:          SubmittedItem[]   – full desired item list (existing + new)
 *   removedItemIds: string[]          – IDs of items to delete
 *   shipping_price: number
 *   discount_total: number
 *   actorName?:     string            – display name for timeline ("reda laalak")
 * }
 *
 * Returns: { ok, subtotal, shipping, discount, total }
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    const {
      items         = [],
      removedItemIds = [],
      shipping_price,
      discount_total,
      actorName = 'user',
    } = await req.json()

    // ── 1. Fetch current order snapshot for comparison ────────────────────
    const { data: currentOrder, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('subtotal_price, shipping_price, discount_total, total_price')
      .eq('id', orderId)
      .single()

    if (fetchErr || !currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // ── 2. Fetch current items for old→new diff in log messages ──────────
    const { data: currentItemRows } = await supabaseAdmin
      .from('order_items')
      .select('id, title, quantity, unit_price')
      .eq('order_id', orderId)

    const currentItemMap = new Map(
      (currentItemRows || []).map(i => [i.id, i])
    )

    // Collect log calls; fire them all at the end so a log failure
    // never blocks the actual save.
    const pendingLogs: Promise<void>[] = []

    // ── 3. Delete removed items ───────────────────────────────────────────
    for (const itemId of removedItemIds) {
      const old = currentItemMap.get(itemId)
      const { error } = await supabaseAdmin
        .from('order_items')
        .delete()
        .eq('id', itemId)
      if (!error && old) {
        pendingLogs.push(logOrderEvent({
          orderId,
          eventType: 'item_removed',
          title: 'Item removed',
          description: old.title,
          actorName,
          source: 'user_action',
          metadata: {
            item_title: old.title,
            quantity: old.quantity,
            unit_price: old.unit_price,
          },
        }))
      }
    }

    // ── 4. Update existing items / insert new items ───────────────────────
    for (const item of (items as SubmittedItem[])) {
      const lineTotal = Number(item.quantity) * Number(item.unit_price)

      if (item.id) {
        // ── Update existing ────────────────────────────────────────────
        const old = currentItemMap.get(item.id)
        await supabaseAdmin
          .from('order_items')
          .update({
            title:       item.title,
            quantity:    item.quantity,
            unit_price:  item.unit_price,
            total_price: lineTotal,
          })
          .eq('id', item.id)

        if (old) {
          if (old.quantity !== item.quantity) {
            pendingLogs.push(logOrderEvent({
              orderId,
              eventType: 'item_quantity_changed',
              title: 'Quantity changed',
              description: `${item.title}: ${old.quantity} → ${item.quantity}`,
              actorName,
              source: 'user_action',
              metadata: { item_id: item.id, old_qty: old.quantity, new_qty: item.quantity },
            }))
          }
          if (Math.abs(Number(old.unit_price) - Number(item.unit_price)) > 0.001) {
            pendingLogs.push(logOrderEvent({
              orderId,
              eventType: 'item_price_changed',
              title: 'Unit price changed',
              description: `${item.title}: MAD${Number(old.unit_price).toFixed(2)} → MAD${Number(item.unit_price).toFixed(2)}`,
              actorName,
              source: 'user_action',
              metadata: { item_id: item.id, old_price: old.unit_price, new_price: item.unit_price },
            }))
          }
        }
      } else {
        // ── Insert new item ─────────────────────────────────────────────
        //
        // Build the core insert payload using only columns that are
        // guaranteed to exist in the original schema (01_init.sql).
        // image_url is intentionally omitted here: it is NOT in the
        // original schema, so including it would cause "column does not
        // exist" errors on any DB that hasn't run db/03_order_edit.sql.
        // Persistence is the priority; thumbnails for manually-added
        // items can be backfilled once the migration has been applied.
        const insertPayload: Record<string, unknown> = {
          order_id:           orderId,
          shopify_product_id: item.shopify_product_id ?? null,
          shopify_variant_id: item.shopify_variant_id ?? null,
          sku:                item.sku ?? null,
          title:              item.title,
          variant_title:      item.variant_title ?? null,
          quantity:           item.quantity,
          unit_price:         item.unit_price,
          total_price:        lineTotal,
        }
        // is_custom is also from db/03_order_edit.sql — only include it
        // when it is explicitly true so custom-item saves show a clear
        // error if the migration hasn't run, rather than breaking all saves.
        if (item.is_custom)  insertPayload.is_custom = true

        const { error: insErr } = await supabaseAdmin
          .from('order_items')
          .insert(insertPayload)

        // ← Previously this error was silently ignored, causing ok:true to
        //   be returned even when the item was never saved.  Throw now so the
        //   UI receives a real error message instead.
        if (insErr) {
          throw new Error(`Failed to add "${item.title}": ${insErr.message}`)
        }

        pendingLogs.push(logOrderEvent({
          orderId,
          eventType: 'item_added',
          title: item.is_custom ? 'Custom item added' : 'Product added',
          description: item.title,
          actorName,
          source: 'user_action',
          metadata: {
            title:      item.title,
            quantity:   item.quantity,
            unit_price: item.unit_price,
            is_custom:  item.is_custom ?? false,
          },
        }))
      }
    }

    // ── 5. Recalculate totals from the DB (source of truth) ───────────────
    const { data: freshItems } = await supabaseAdmin
      .from('order_items')
      .select('quantity, unit_price')
      .eq('order_id', orderId)

    const subtotal = (freshItems || []).reduce(
      (sum, i) => sum + Number(i.quantity) * Number(i.unit_price),
      0
    )

    const newShipping = Number(shipping_price ?? currentOrder.shipping_price)
    const newDiscount = Number(discount_total  ?? currentOrder.discount_total)
    const total       = subtotal + newShipping - newDiscount

    // ── 6. Log shipping / discount changes ────────────────────────────────
    if (Math.abs(Number(currentOrder.shipping_price) - newShipping) > 0.001) {
      pendingLogs.push(logOrderEvent({
        orderId,
        eventType: 'order_edited',
        title: 'Shipping price changed',
        description: `MAD${Number(currentOrder.shipping_price).toFixed(2)} → MAD${newShipping.toFixed(2)}`,
        actorName,
        source: 'user_action',
        metadata: { old: currentOrder.shipping_price, new: newShipping },
      }))
    }

    if (Math.abs(Number(currentOrder.discount_total) - newDiscount) > 0.001) {
      pendingLogs.push(logOrderEvent({
        orderId,
        eventType: 'order_edited',
        title: 'Discount changed',
        description: `MAD${Number(currentOrder.discount_total).toFixed(2)} → MAD${newDiscount.toFixed(2)}`,
        actorName,
        source: 'user_action',
        metadata: { old: currentOrder.discount_total, new: newDiscount },
      }))
    }

    // ── 7. Save totals to orders table ────────────────────────────────────
    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        subtotal_price: subtotal,
        shipping_price: newShipping,
        discount_total: newDiscount,
        total_price:    total,
        amount_due:     total,
        updated_at:     new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateErr) throw updateErr

    // Top-level "order edited" summary event
    pendingLogs.push(logOrderEvent({
      orderId,
      eventType: 'order_edited',
      title: 'Order edited',
      description: `Total updated to MAD${total.toFixed(2)}`,
      actorName,
      source: 'user_action',
      metadata: { subtotal, shipping: newShipping, discount: newDiscount, total },
    }))

    // Fire all log writes in parallel — never throws
    await Promise.all(pendingLogs)

    return NextResponse.json({
      ok:       true,
      subtotal,
      shipping: newShipping,
      discount: newDiscount,
      total,
    })
  } catch (err: any) {
    console.error('[orders/edit]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
