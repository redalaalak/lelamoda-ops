-- order_events: unified timeline for every order
CREATE TABLE IF NOT EXISTS public.order_events (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id      uuid        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type    text        NOT NULL,
  title         text        NOT NULL,
  description   text,
  actor_name    text        NOT NULL DEFAULT 'system',
  actor_user_id text,
  source        text        NOT NULL DEFAULT 'system',
  metadata      jsonb,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON public.order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_created_at ON public.order_events(created_at);

ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.order_events USING (true) WITH CHECK (true);

-- subscribers (waitlist)
CREATE TABLE IF NOT EXISTS public.subscribers (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text        NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "insert_subscriber" ON public.subscribers FOR INSERT WITH CHECK (true);

-- contact messages
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text        NOT NULL,
  email      text        NOT NULL,
  message    text        NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "insert_contact" ON public.contact_messages FOR INSERT WITH CHECK (true);
