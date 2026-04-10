import Link from 'next/link'
import AutoRefresh from '@/components/AutoRefresh'

export const dynamic = 'force-dynamic'

async function getShopifyProducts() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN!
  const token = process.env.SHOPIFY_ADMIN_API_TOKEN!

  const res = await fetch(
    `https://${domain}/admin/api/2024-01/products.json?limit=250&fields=id,title,status,product_type,variants,images,created_at`,
    {
      headers: { 'X-Shopify-Access-Token': token },
      cache: 'no-store',
    }
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.products || []
}

export default async function ProductsPage() {
  const products = await getShopifyProducts()

  const active = products.filter((p: any) => p.status === 'active').length
  const draft = products.filter((p: any) => p.status === 'draft').length
  const archived = products.filter((p: any) => p.status === 'archived').length

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

      {/* Stats */}
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

      {/* Products Grid */}
      <div className="bg-white rounded-xl border border-gray-100">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Product</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Variants</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Stock</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Price</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product: any) => {
              const image = product.images?.[0]?.src
              const totalVariantStock = product.variants.reduce((s: number, v: any) => s + (v.inventory_quantity || 0), 0)
              const minPrice = Math.min(...product.variants.map((v: any) => parseFloat(v.price)))
              const maxPrice = Math.max(...product.variants.map((v: any) => parseFloat(v.price)))
              const lowStock = totalVariantStock > 0 && totalVariantStock <= 10

              return (
                <tr key={product.id} onClick={() => window.location.href = `/products/${product.id}`} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {image ? (
                        <img src={image} alt={product.title} className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-300">📦</div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.title}</div>
                        {product.product_type && (
                          <div className="text-xs text-gray-400">{product.product_type}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${
                      product.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      product.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {product.variants.length} variant{product.variants.length > 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-semibold ${
                      totalVariantStock === 0 ? 'text-red-500' :
                      lowStock ? 'text-amber-500' :
                      'text-gray-900'
                    }`}>
                      {totalVariantStock}
                    </span>
                    {totalVariantStock === 0 && (
                      <div className="text-xs text-red-400">Out of stock</div>
                    )}
                    {lowStock && (
                      <div className="text-xs text-amber-400">Low stock</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {minPrice === maxPrice
                      ? `MAD ${minPrice.toFixed(0)}`
                      : `MAD ${minPrice.toFixed(0)} – ${maxPrice.toFixed(0)}`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
