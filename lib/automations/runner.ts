import { supabaseAdmin } from '@/lib/supabase/admin'

export async function runAutomations(
  triggerType: 'ameex_status' | 'order_status',
  triggerValue: string,
  orderId: string,
) {
  const { data: automations } = await supabaseAdmin
    .from('automations')
    .select('*')
    .eq('trigger_type', triggerType)
    .eq('trigger_value', triggerValue)
    .eq('is_active', true)

  if (!automations?.length) return

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, customer_phone, shipping_phone, customer_full_name, shopify_order_name, business_status')
    .eq('id', orderId)
    .single()

  if (!order) return

  for (const automation of automations) {
    try {
      if (automation.action_type === 'change_order_status') {
        // Don't downgrade status if already at a terminal state
        const terminal = ['delivered', 'returned']
        if (terminal.includes(order.business_status) && !terminal.includes(automation.action_value)) continue

        await supabaseAdmin
          .from('orders')
          .update({ business_status: automation.action_value })
          .eq('id', orderId)

        await supabaseAdmin.from('order_events').insert({
          order_id: orderId,
          event_type: 'automation',
          title: `Auto: ${automation.name}`,
          description: `Status → ${automation.action_value}`,
          actor_name: 'Automation',
          source: 'automation',
          metadata: { automation_id: automation.id },
        })

      } else if (automation.action_type === 'send_whatsapp') {
        const phone = order.shipping_phone || order.customer_phone
        if (!phone) continue

        const message = automation.action_message
          ?.replace('{name}', order.customer_full_name || 'Client')
          ?.replace('{order}', order.shopify_order_name || '')

        if (!message) continue

        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderId, phone, message }),
        })
      }

      // Increment run count
      await supabaseAdmin
        .from('automations')
        .update({ run_count: (automation.run_count || 0) + 1 })
        .eq('id', automation.id)

    } catch (e) {
      console.error('Automation error:', automation.id, e)
    }
  }
}
