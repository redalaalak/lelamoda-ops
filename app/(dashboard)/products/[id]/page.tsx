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
  const data = await res.json()
  return data.product || null
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id)
  if (!product) notFound()

  const totalStock = product.variants.reduce((s: number, v: any) => s + (v.inventory_quantity || 0), 0)
  const prices = product.variants.map((v: any) => parseFloat(v.price))
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/products" className="text-gray-400 hover:text-gray-600 text-sm">Products</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-semibold text-gray-900 truncate">{product.title}</h1>
        <span className={`ml-2 px-2 py-0.5 rounded-md text-xs font-medium shrink-0 ${
          product.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
          product.status === 'draft' ? 'bg-amber-100 text-amber-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {product.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left — Images */}
        <div className="col-span-1 space-y-3">
          {product.images?.length > 0 ? (
            <>
              <img
                src={product.images[0].src}
                alt={product.title}
                className="w-full rounded-xl border border-gray-100 object-cover aspect-square"
              />
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-1.5">
                  {product.images.slice(1, 5).map((img: any) => (
                    <img
                      key={img.id}
                      src={img.src}
                      alt=""
                      className="w-full rounded-lg border border-gray-100 object-cover aspect-square"
                    />
                  ))}
                </div>
              )}
              <div className="text-xs text-gray-400 text-center">{product.images.length} photo{product.images.length > 1 ? 's' : ''}</div>
            </>
          ) : (
            <div className="w-full aspect-square rounded-xl bg-gray-100 flex items-center justify-center text-5xl text-gray-300">📦</div>
          )}
        </div>

        {/* Right — Details */}
        <div className="col-span-2 space-y-4">
          {/* Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-gray-400 mb-1">Price</div>
                <div className="font-semibold text-gray-900">
                  {minPrice === maxPrice ? `MAD ${minPrice.toFixed(0)}` : `MAD ${minPrice.toFixed(0)} – ${maxPrice.toFixed(0)}`}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Total Stock</div>
                <div className={`font-semibold ${totalStock === 0 ? 'text-red-500' : totalStock <= 10 ? 'text-amber-500' : 'text-gray-900'}`}>
                  {totalStock} units
                </div>
              </div>
              {product.vendor && (
                <div>
                  <div className="text-xs text-gray-400 mb-1">Vendor</div>
                  <div className="text-gray-700">{product.vendor}</div>
                </div>
              )}
              {product.product_type && (
                <div>
                  <div className="text-xs text-gray-400 mb-1">Type</div>
                  <div className="text-gray-700">{product.product_type}</div>
                </div>
              )}
              {product.tags && (
                <div className="col-span-2">
                  <div className="text-xs text-gray-400 mb-1">Tags</div>
                  <div className="flex flex-wrap gap-1">
                    {product.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean).map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-gray-700">Variants ({product.variants.length})</div>
              <div className="text-xs text-gray-400">
                Options: {product.options?.map((o: any) => o.name).join(', ')}
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
                    <td className="py-2.5">
                      <div className="font-medium text-gray-900">{v.title}</div>
                    </td>
                    <td className="py-2.5 text-gray-400 text-xs">{v.sku || '—'}</td>
                    <td className="py-2.5 text-right font-medium text-gray-900">MAD {parseFloat(v.price).toFixed(0)}</td>
                    <td className="py-2.5 text-right">
                      <span className={`font-semibold ${
                        v.inventory_quantity === 0 ? 'text-red-500' :
                        v.inventory_quantity <= 5 ? 'text-amber-500' :
                        'text-gray-900'
                      }`}>
                        {v.inventory_quantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Description */}
          {product.body_html && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-sm font-semibold text-gray-700 mb-3">Description</div>
              <div
                className="text-sm text-gray-600 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.body_html }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
