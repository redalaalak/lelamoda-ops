import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.SHOPIFY_CLIENT_ID!
  const shop = process.env.SHOPIFY_STORE_DOMAIN!
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/shopify/callback`

  const scopes = [
    'read_orders',
    'read_all_orders',
    'read_products',
    'read_customers',
    'read_inventory',
    'write_fulfillments',
  ].join(',')

  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}`

  return NextResponse.redirect(authUrl)
}
