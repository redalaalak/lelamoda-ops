-- Subscribers (waitlist)
CREATE TABLE IF NOT EXISTS public.subscribers (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email       text        NOT NULL UNIQUE,
  created_at  timestamptz DEFAULT now()
);

-- Contact messages
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL,
  email       text        NOT NULL,
  message     text        NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- RLS: only service role can read (admin sees data, public can only insert)
ALTER TABLE public.subscribers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_subscriber"      ON public.subscribers       FOR INSERT WITH CHECK (true);
CREATE POLICY "insert_contact_message" ON public.contact_messages  FOR INSERT WITH CHECK (true);
