-- ============================================================
-- order_items enhancements for edit-order feature
-- Safe to re-run (uses IF NOT EXISTS).
-- ============================================================

-- Flag items that were added manually by an agent (not from Shopify)
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS is_custom boolean NOT NULL DEFAULT false;

-- Product thumbnail URL (already populated by ingest, make it explicit)
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS image_url text;
