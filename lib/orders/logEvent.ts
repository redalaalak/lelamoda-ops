import { supabaseAdmin } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------
export type OrderEventType =
  | 'order_created'
  | 'order_imported'
  | 'business_status_changed'
  | 'payment_status_changed'
  | 'stock_status_changed'
  | 'shipping_status_changed'
  | 'tracking_updated'
  | 'parcel_created'
  | 'note_added'
  | 'customer_info_updated'

// ---------------------------------------------------------------------------
// Source identifiers
// ---------------------------------------------------------------------------
export type OrderEventSource =
  | 'user_action'
  | 'system'
  | 'shopify_webhook'
  | 'automation'
  | 'shipping_integration'
  | 'csv_import'

// ---------------------------------------------------------------------------
// Shape returned when querying order_events
// ---------------------------------------------------------------------------
export type OrderEvent = {
  id: string
  order_id: string
  event_type: string
  title: string
  description: string | null
  actor_name: string
  actor_user_id: string | null
  source: string
  metadata: Record<string, unknown> | null
  created_at: string
}

// ---------------------------------------------------------------------------
// logOrderEvent — insert one event row
// ---------------------------------------------------------------------------
export interface LogOrderEventParams {
  orderId: string
  eventType: OrderEventType
  title: string
  description?: string
  actorName?: string
  actorUserId?: string
  source?: OrderEventSource | string
  metadata?: Record<string, unknown>
}

export async function logOrderEvent(params: LogOrderEventParams): Promise<void> {
  const { error } = await supabaseAdmin.from('order_events').insert({
    order_id:      params.orderId,
    event_type:    params.eventType,
    title:         params.title,
    description:   params.description   ?? null,
    actor_name:    params.actorName     ?? 'system',
    actor_user_id: params.actorUserId   ?? null,
    source:        params.source        ?? 'system',
    metadata:      params.metadata      ?? null,
  })

  if (error) {
    // Never throw — a logging failure must not break the primary action
    console.error('[logOrderEvent] failed:', error.message)
  }
}
