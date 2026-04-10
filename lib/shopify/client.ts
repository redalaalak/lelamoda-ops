const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN!
const API_VERSION = '2024-01'

export async function fetchProductImage(productId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/products/${productId}.json?fields=images`,
      { headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.product?.images?.[0]?.src || null
  } catch {
    return null
  }
}
