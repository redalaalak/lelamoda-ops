'use client'

import { useState } from 'react'

type Variant = { price: string; inventory_quantity: number; sku: string }
type Product = {
  id: number
  title: string
  status: string
  product_type: string
  images: { src: string }[]
  variants: Variant[]
}

export default function ProductsTable({ products }: { products: Product[] }) {
  const [tab, setTab] = useState<'all' | 'active' | 'draft'>('all')
  const [search, setSearch] = useState('')

  const filtered = products.filter(p => {
    const matchTab = tab === 'all' || p.status === tab
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const activeCount = products.filter(p => p.status === 'active').length
  const draftCount = products.filter(p => p.status === 'draft').length

  return (
    <div>
      {/* Search + Tabs */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="relative mb-3">
          <svg className="absolute left-3 top-2.5 text-gray-400" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-gray-50"
          />
        </div>
        <div className="flex items-center gap-1">
          {([
            { key: 'all', label: `All (${products.length})` },
            { key: 'active', label: `Active (${activeCount})` },
            { key: 'draft', label: `Draft (${draftCount})` },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                tab === t.key
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="w-10 px-4 py-3">
              <input type="checkbox" className="rounded border-gray-300" />
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Product</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Inventory</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Category</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((product) => {
            const image = product.images?.[0]?.src
            const totalStock = product.variants.reduce((s, v) => s + (v.inventory_quantity || 0), 0)

            return (
              <tr
                key={product.id}
                onClick={() => window.location.href = `/admin/products/${product.id}`}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" className="rounded border-gray-300" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {image ? (
                      <img src={image} alt={product.title} className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-300 text-base">📦</div>
                    )}
                    <span className="text-sm font-medium text-gray-900 group-hover:text-emerald-600 transition-colors">
                      {product.title}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide ${
                    product.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    product.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {product.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <span className={totalStock === 0 ? 'text-red-500 font-medium' : totalStock <= 10 ? 'text-amber-500 font-medium' : ''}>
                    {totalStock} in stock
                  </span>
                  <span className="text-gray-400"> for {product.variants.length} variant{product.variants.length > 1 ? 's' : ''}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {product.product_type || '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">No products found</div>
      )}

      <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 text-right">
        {filtered.length} products
      </div>
    </div>
  )
}
