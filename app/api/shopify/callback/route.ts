import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const shop = url.searchParams.get('shop')

  if (!code || !shop) {
    return NextResponse.json({ error: 'Missing code or shop' }, { status: 400 })
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID!
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET!

  // Exchange code for access token
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  })

  const data = await response.json()

  if (data.access_token) {
    console.log('✅ Shopify Access Token received!')
    console.log('Token:', data.access_token)
    console.log('Scope:', data.scope)

    // Show token to user so they can save it
    return new NextResponse(`
      <html>
        <body style="font-family: monospace; padding: 40px; background: #f0fdf4;">
          <h2 style="color: #15803d;">✅ Shopify Connected!</h2>
          <p><strong>Shop:</strong> ${shop}</p>
          <p><strong>Access Token:</strong></p>
          <code style="background: #dcfce7; padding: 12px; display: block; border-radius: 8px; word-break: break-all;">
            ${data.access_token}
          </code>
          <p style="color: #991b1b; margin-top: 20px;">⚠️ Copy this token and save it in your .env.local as SHOPIFY_ADMIN_API_TOKEN</p>
          <p style="color: #64748b;">Then add it to Vercel environment variables too.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  return NextResponse.json({ error: 'Failed to get token', data }, { status: 400 })
}
