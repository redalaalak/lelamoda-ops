import AutoRefresh from '@/components/AutoRefresh'
import ProductsTable from '@/components/products/ProductsTable'

export const dynamic = 'force-dynamic'

async function getShopifyProducts() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN!
  const token = process.env.SHOPIFY_ADMIN_API_TOKEN!
  const res = await fetch(
    `https://${domain}/admin/api/2024-01/products.json?limit=250&fields=id,title,status,product_type,variants,images`,
    { headers: { 'X-Shopify-Access-Token': token }, cache: 'no-store' }
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.products || []
}

export default async function ProductsPage() {
  const products = await getShopifyProducts()

  const lowStock = products.filter((p: any) =>
    p.variants.some((v: any) => v.inventory_quantity > 0 && v.inventory_quantity <= 10)
  ).length

  const outOfStock = products.filter((p: any) =>
    p.variants.every((v: any) => v.inventory_quantity === 0)
  ).length

  const categorySet = new Set<string>(products.map((p: any) => p.product_type).filter(Boolean))
  const categories = categorySet.size

  return (
    <div className="p-6">
      <AutoRefresh intervalMs={30000} />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-semibold text-gray-900">Products</h1>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs text-gray-400">Synced from Shopify</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Total Products</span>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">{products.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Low Stock</span>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">{lowStock}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Out Of Stock</span>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">{outOfStock}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Categories</span>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#8b5cf6" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">{categories}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <ProductsTable products={products} />
      </div>
    </div>
  )
}
