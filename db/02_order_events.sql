-- ============================================================
-- order_events: unified activity timeline for every order
-- Replaces order_status_history as the primary timeline source.
-- order_status_history is kept for backward-compat but no longer
-- read by the UI.
-- ============================================================

create table if not exists order_events (
  id            uuid        primary key default gen_random_uuid(),
  order_id      uuid        not null references orders(id) on delete cascade,

  -- What happened
  event_type    text        not null,
  -- e.g. order_created | order_imported | business_status_changed |
  --      payment_status_changed | stock_status_changed |
  --      shipping_status_changed | tracking_updated | parcel_created |
  --      note_added | customer_info_updated

  -- Human-readable lines shown in the timeline
  title         text        not null,
  description   text,

  -- Who triggered the action
  actor_name    text        not null default 'system',
  actor_user_id uuid,

  -- Machine-readable origin
  source        text        not null default 'system',
  -- user_action | system | shopify_webhook | automation |
  -- shipping_integration | csv_import

  -- Flexible payload (old_status, new_status, tracking_number, etc.)
  metadata      jsonb,

  created_at    timestamptz not null default now()
);

-- Composite index: most queries are "all events for order X, newest first"
create index if not exists order_events_order_id_created_idx
  on order_events(order_id, created_at desc);
