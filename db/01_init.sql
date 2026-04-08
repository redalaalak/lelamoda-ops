create extension if not exists pgcrypto;

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  shopify_customer_id text unique,
  first_name text,
  last_name text,
  full_name text,
  email text,
  phone text,
  whatsapp_phone text,
  city text,
  country_code text default 'MA',
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_customers_phone on customers(phone);
create index if not exists idx_customers_email on customers(email);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  shopify_order_id text not null unique,
  shopify_order_number text,
  shopify_order_name text,
  customer_id uuid references customers(id) on delete set null,
  business_status text not null default 'pending_confirmation',
  payment_status text not null default 'pending',
  stock_status text not null default 'not_checked',
  shipping_status text not null default 'no_parcel',
  duplicate_flag boolean not null default false,
  blocked_flag boolean not null default false,
  currency_code text default 'MAD',
  subtotal_price numeric(12,2) default 0,
  discount_total numeric(12,2) default 0,
  shipping_price numeric(12,2) default 0,
  total_price numeric(12,2) default 0,
  amount_due numeric(12,2) default 0,
  payment_method text,
  customer_note text,
  internal_note text,
  customer_full_name text,
  customer_phone text,
  customer_email text,
  shipping_first_name text,
  shipping_last_name text,
  shipping_phone text,
  shipping_address1 text,
  shipping_address2 text,
  shipping_city text,
  shipping_province text,
  shipping_zip text,
  shipping_country_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orders_customer_id on orders(customer_id);
create index if not exists idx_orders_business_status on orders(business_status);
create index if not exists idx_orders_customer_phone on orders(customer_phone);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  shopify_line_item_id text,
  shopify_product_id text,
  shopify_variant_id text,
  sku text,
  title text,
  variant_title text,
  quantity integer not null default 1,
  unit_price numeric(12,2) default 0,
  total_price numeric(12,2) default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_order_items_order_id on order_items(order_id);

create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  old_business_status text,
  new_business_status text,
  old_payment_status text,
  new_payment_status text,
  old_stock_status text,
  new_stock_status text,
  old_shipping_status text,
  new_shipping_status text,
  changed_by_source text not null default 'system',
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists webhook_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  event_name text not null,
  external_id text,
  payload jsonb not null,
  processed boolean not null default false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);
