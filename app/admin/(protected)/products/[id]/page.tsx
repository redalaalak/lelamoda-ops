import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getProduct(id: string) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN!
  const token = process.env.SHOPIFY_ADMIN_API_TOKEN!
  const res = await fetch(
    `https://${domain}/admin/api/2024-01/products/${id}.json`,
    { headers: { 'X-Shopify-Access-Token': token }, cache: 'no-store' }
  )
  if (!res.ok) return null
  return (await res.json()).product || null
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id)
  if (!product) notFound()

  const totalStock = product.variants.reduce((s: number, v: any) => s + (v.inventory_quantity || 0), 0)
  const prices = product.variants.map((v: any) => parseFloat(v.price))
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Products
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-semibold text-gray-900 truncate">{product.title}</h1>
      </div>

      <div className="grid grid-cols-3 gap-5">

        {/* Left — Main Content */}
        <div className="col-span-2 space-y-4">

          {/* Title */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-xs font-medium text-gray-400 mb-2">Title</div>
            <div className="text-base font-semibold text-gray-900">{product.title}</div>
          </div>

          {/* Description */}
          {product.body_html && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 mb-3">Description</div>
              <div
                className="text-sm text-gray-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: product.body_html }}
              />
            </div>
          )}

          {/* Media */}
          {product.images?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 mb-3">Media ({product.images.length})</div>
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img: any, i: number) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.src}
                      alt={product.title}
                      className={`w-full object-cover rounded-lg border border-gray-100 ${i === 0 ? 'aspect-square' : 'aspect-square'}`}
                    />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">Main</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variants */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-medium text-gray-400">Variants ({product.variants.length})</div>
              <div className="text-xs text-gray-400">
                {product.options?.map((o: any) => o.name).join(' · ')}
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs text-gray-400 font-medium">Variant</th>
                  <th className="text-left py-2 text-xs text-gray-400 font-medium">SKU</th>
                  <th className="text-right py-2 text-xs text-gray-400 font-medium">Price</th>
                  <th className="text-right py-2 text-xs text-gray-400 font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {product.variants.map((v: any) => (
                  <tr key={v.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 font-medium text-gray-900">{v.title}</td>
                    <td className="py-2.5 text-gray-400 text-xs font-mono">{v.sku || '—'}</td>
                    <td className="py-2.5 text-right font-medium text-gray-900">MAD {parseFloat(v.price).toFixed(0)}</td>
                    <td className="py-2.5 text-right">
                      <span className={`font-semibold text-sm ${
                        v.inventory_quantity === 0 ? 'text-red-500' :
                        v.inventory_quantity <= 5 ? 'text-amber-500' : 'text-gray-900'
                      }`}>
                        {v.inventory_quantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-100">
                  <td colSpan={3} className="pt-2.5 text-xs text-gray-400 font-medium">Total Stock</td>
                  <td className="pt-2.5 text-right font-bold text-gray-900">{totalStock}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Right — Sidebar */}
        <div className="space-y-4">

          {/* Status */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs font-medium text-gray-400 mb-2">Status</div>
            <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide ${
              product.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
              product.status === 'draft' ? 'bg-gray-100 text-gray-600' :
              'bg-red-100 text-red-600'
            }`}>
              {product.status}
            </span>
          </div>

          {/* Price */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs font-medium text-gray-400 mb-2">Price</div>
            <div className="font-semibold text-gray-900">
              {minPrice === maxPrice
                ? `MAD ${minPrice.toFixed(0)}`
                : `MAD ${minPrice.toFixed(0)} – ${maxPrice.toFixed(0)}`}
            </div>
          </div>

          {/* Tags */}
          {product.tags && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-xs font-medium text-gray-400 mb-2">Tags</div>
              <div className="flex flex-wrap gap-1">
                {product.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean).map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Product Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3 text-sm">
            {product.vendor && (
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Vendor</div>
                <div className="text-gray-700">{product.vendor}</div>
              </div>
            )}
            {product.product_type && (
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Category</div>
                <div className="text-gray-700">{product.product_type}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Handle</div>
              <div className="text-gray-500 text-xs font-mono">{product.handle}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Created</div>
              <div className="text-gray-600 text-xs">{new Date(product.created_at).toLocaleDateString('fr-MA')}</div>
            </div>
          </div>

          {/* Shopify link */}
          <a
            href={`https://nhgjws-ia.myshopify.com/admin/products/${product.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-50 text-gray-600 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-100 transition"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View in Shopify
          </a>
        </div>
      </div>
    </div>
  )
}
