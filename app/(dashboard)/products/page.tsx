import AutoRefresh from '@/components/AutoRefresh'
import ProductsTable from '@/components/products/ProductsTable'

export const dynamic = 'force-dynamic'

async function getShopifyProducts() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN!
  const token = process.env.SHOPIFY_ADMIN_API_TOKEN!
  const res = await fetch(
    `https://${domain}/admin/api/2024-01/products.json?limit=250&fields=id,title,status,product_type,variants,images,created_at`,
    { headers: { 'X-Shopify-Access-Token': token }, cache: 'no-store' }
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.products || []
}

export default async function ProductsPage() {
  const products = await getShopifyProducts()

  const active = products.filter((p: any) => p.status === 'active').length
  const draft = products.filter((p: any) => p.status === 'draft').length
  const totalStock = products.reduce((sum: number, p: any) =>
    sum + p.variants.reduce((s: number, v: any) => s + (v.inventory_quantity || 0), 0), 0)

  return (
    <div className="p-6">
      <AutoRefresh intervalMs={30000} />
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-semibold text-gray-900">Products</h1>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs text-gray-400">{products.length} products · auto-refresh 30s</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{products.length}</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{active}</div>
            <div className="text-xs text-gray-400">Active</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{draft}</div>
            <div className="text-xs text-gray-400">Draft</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#8b5cf6" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalStock}</div>
            <div className="text-xs text-gray-400">Total Stock</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <ProductsTable products={products} />
      </div>
    </div>
  )
}
