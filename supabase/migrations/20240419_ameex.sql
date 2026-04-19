ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS ameex_parcel_code text,
  ADD COLUMN IF NOT EXISTS ameex_status text,
  ADD COLUMN IF NOT EXISTS ameex_status_name text;

CREATE INDEX IF NOT EXISTS orders_ameex_parcel_code_idx ON orders(ameex_parcel_code);
