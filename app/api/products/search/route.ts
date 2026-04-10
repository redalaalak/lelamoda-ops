import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/products/search?q=robe
 * Proxies a Shopify product title search and returns a slim payload
 * suitable for the order edit product picker.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()

  if (!q) return NextResponse.json({ products: [] })

  const domain = process.env.SHOPIFY_STORE_DOMAIN!
  const token  = process.env.SHOPIFY_ADMIN_API_TOKEN!

  try {
    const url = `https://${domain}/admin/api/2024-01/products.json?title=${encodeURIComponent(q)}&limit=20&fields=id,title,variants,images`
    const res = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': token },
      cache: 'no-store',
    })

    if (!res.ok) return NextResponse.json({ products: [] })

    const data = await res.json()

    // Slim the payload — only what the product picker needs
    const products = (data.products || []).map((p: any) => ({
      id:     p.id,
      title:  p.title,
      images: p.images?.slice(0, 1) ?? [],
      variants: (p.variants || []).map((v: any) => ({
        id:    v.id,
        title: v.title,
        price: v.price,
        sku:   v.sku ?? null,
      })),
    }))

    return NextResponse.json({ products })
  } catch (err: any) {
    console.error('[products/search]', err.message)
    return NextResponse.json({ products: [] })
  }
}
