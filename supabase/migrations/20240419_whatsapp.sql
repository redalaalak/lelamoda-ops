-- WhatsApp Business integration tables

CREATE TABLE IF NOT EXISTS whatsapp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id text NOT NULL,
  waba_id text NOT NULL,
  access_token text NOT NULL,
  phone_number text,
  display_name text,
  webhook_verify_token text NOT NULL DEFAULT gen_random_uuid()::text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  customer_phone text NOT NULL,
  customer_name text,
  direction text NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  message_type text NOT NULL DEFAULT 'text',
  template_name text,
  content text,
  status text DEFAULT 'sent',
  wa_message_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_messages_order_id_idx ON whatsapp_messages(order_id);
CREATE INDEX IF NOT EXISTS whatsapp_messages_phone_idx ON whatsapp_messages(customer_phone);
