# LelaModa Ops Starter

First milestone:
- receive Shopify order webhook
- verify HMAC
- save webhook event
- create or update customer
- create order
- create order items
- save initial status history
- show orders in `/orders`

## 1. Install

```bash
npm install
```

## 2. Env

Copy `.env.example` to `.env.local` and add:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SHOPIFY_WEBHOOK_SECRET=...
```

## 3. Supabase SQL

Run:

- `db/01_init.sql`

inside Supabase SQL editor.

## 4. Run local

```bash
npm run dev
```

## 5. Shopify webhook URL

After deploy on Vercel, use:

```text
https://YOUR-VERCEL-DOMAIN/api/webhooks/shopify/orders-create
```

Topic:
- Order creation

Format:
- JSON
