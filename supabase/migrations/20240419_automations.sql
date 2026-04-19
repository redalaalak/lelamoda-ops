CREATE TABLE IF NOT EXISTS automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL CHECK (trigger_type IN ('ameex_status', 'order_status')),
  trigger_value text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('change_order_status', 'send_whatsapp')),
  action_value text NOT NULL,
  action_message text,
  is_active boolean DEFAULT true,
  run_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Default automations: Ameex → Order status
INSERT INTO automations (name, trigger_type, trigger_value, action_type, action_value) VALUES
  ('Ameex Ramassé → Expédié',      'ameex_status', 'PICKED_UP',    'change_order_status', 'shipped'),
  ('Ameex En cours → Expédié',     'ameex_status', 'IN_PROGRESS',  'change_order_status', 'shipped'),
  ('Ameex Distribution → Expédié', 'ameex_status', 'DISTRIBUTION', 'change_order_status', 'shipped'),
  ('Ameex En expédition → Expédié','ameex_status', 'IN_SHIPMENT',  'change_order_status', 'shipped'),
  ('Ameex Livré → Livré',          'ameex_status', 'DELIVERED',    'change_order_status', 'delivered'),
  ('Ameex Retourné → Retourné',    'ameex_status', 'RETURNED',     'change_order_status', 'returned')
ON CONFLICT DO NOTHING;
