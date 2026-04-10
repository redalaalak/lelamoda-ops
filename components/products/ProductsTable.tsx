'use client'

type Product = {
  id: number
  title: string
  status: string
  product_type: string
  images: { src: string }[]
  variants: { price: string; inventory_quantity: number; sku: string }[]
}

export default function ProductsTable({ products }: { products: Product[] }) {
  return (
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
        {products.map((product) => {
          const image = product.images?.[0]?.src
          const totalStock = product.variants.reduce((s, v) => s + (v.inventory_quantity || 0), 0)
          const prices = product.variants.map(v => parseFloat(v.price))
          const minPrice = Math.min(...prices)
          const maxPrice = Math.max(...prices)
          const lowStock = totalStock > 0 && totalStock <= 10

          return (
            <tr
              key={product.id}
              onClick={() => window.location.href = `/products/${product.id}`}
              className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
            >
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
                  totalStock === 0 ? 'text-red-500' : lowStock ? 'text-amber-500' : 'text-gray-900'
                }`}>
                  {totalStock}
                </span>
                {totalStock === 0 && <div className="text-xs text-red-400">Out of stock</div>}
                {lowStock && <div className="text-xs text-amber-400">Low stock</div>}
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
  )
}
