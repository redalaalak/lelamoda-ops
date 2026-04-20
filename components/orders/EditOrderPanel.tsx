'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type DraftItem = {
  id: string | null             // null = new item (not yet in DB)
  shopify_product_id?: string | null
  shopify_variant_id?: string | null
  sku?: string | null
  title: string
  variant_title?: string | null
  quantity: number
  unit_price: number
  image_url?: string | null
  is_custom?: boolean
}

type ShopifyVariant = {
  id: number
  title: string
  price: string
  sku: string | null
}

type ShopifyProductResult = {
  id: number
  title: string
  images: { src: string }[]
  variants: ShopifyVariant[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function clampQty(n: number) { return Math.max(1, Math.round(n) || 1) }
function mad(n: number) { return `MAD ${n.toFixed(2)}` }

// ---------------------------------------------------------------------------
// Product search modal (shown inline below the item list)
// ---------------------------------------------------------------------------
function ProductSearchPanel({
  onAdd,
  onClose,
}: {
  onAdd: (product: ShopifyProductResult, variant: ShopifyVariant) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<ShopifyProductResult[]>([])
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const search = useCallback(async (query: string) => {
    if (!query.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.products || [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => search(q), 350)
    return () => clearTimeout(timer.current)
  }, [q, search])

  return (
    <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
      {/* Search bar */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 bg-gray-50">
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gray-400 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search products..."
          className="flex-1 text-sm bg-transparent focus:outline-none placeholder-gray-400"
        />
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Results */}
      <div className="max-h-64 overflow-y-auto">
        {loading && (
          <div className="px-4 py-3 text-xs text-gray-400">Searching...</div>
        )}
        {!loading && q.trim() && results.length === 0 && (
          <div className="px-4 py-3 text-xs text-gray-400">No products found for "{q}"</div>
        )}
        {!loading && !q.trim() && (
          <div className="px-4 py-3 text-xs text-gray-400">Type to search your Shopify products</div>
        )}
        {results.map(product => {
          const singleVariant = product.variants.length === 1
          return (
            <div key={product.id} className="border-b border-gray-50 last:border-0">
              {singleVariant ? (
                <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition">
                  {product.images[0]?.src ? (
                    <img src={product.images[0].src} alt={product.title} className="w-9 h-9 object-cover rounded-lg border border-gray-100 shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-base">📦</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{product.title}</div>
                    <div className="text-xs text-gray-400">
                      MAD {parseFloat(product.variants[0].price).toFixed(2)}
                      {product.variants[0].sku && ` · ${product.variants[0].sku}`}
                    </div>
                  </div>
                  <button
                    onClick={() => onAdd(product, product.variants[0])}
                    className="px-2.5 py-1 text-xs font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition shrink-0"
                  >
                    Add
                  </button>
                </div>
              ) : (
                // Multi-variant product — show each variant separately
                <div>
                  <div className="flex items-center gap-3 px-3 pt-2.5 pb-1.5">
                    {product.images[0]?.src ? (
                      <img src={product.images[0].src} alt={product.title} className="w-7 h-7 object-cover rounded border border-gray-100 shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded bg-gray-100 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-gray-700 truncate">{product.title}</span>
                  </div>
                  {product.variants.map(v => (
                    <div key={v.id} className="flex items-center gap-2 px-3 py-1.5 pl-[2.75rem] hover:bg-gray-50 transition">
                      <div className="flex-1 text-xs text-gray-600">{v.title}</div>
                      <div className="text-xs text-gray-400">MAD {parseFloat(v.price).toFixed(2)}</div>
                      <button
                        onClick={() => onAdd(product, v)}
                        className="px-2 py-0.5 text-xs font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Custom item inline form
// ---------------------------------------------------------------------------
function CustomItemForm({
  onAdd,
  onClose,
}: {
  onAdd: (item: DraftItem) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [qty, setQty] = useState(1)
  const [price, setPrice] = useState<number | ''>('')

  const submit = () => {
    if (!title.trim() || price === '') return
    onAdd({
      id: null,
      title: title.trim(),
      quantity: clampQty(qty),
      unit_price: Number(price),
      is_custom: true,
    })
  }

  return (
    <div className="mt-3 border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Custom Item</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="space-y-2">
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Item name..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400"
        />
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2 flex-1">
            <span className="text-xs text-gray-400 shrink-0">Qty</span>
            <input
              type="number" min={1}
              value={qty}
              onChange={e => setQty(parseInt(e.target.value) || 1)}
              className="flex-1 text-sm focus:outline-none w-0 min-w-0"
            />
          </div>
          <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2 flex-1">
            <span className="text-xs text-gray-400 shrink-0">MAD</span>
            <input
              type="number" min={0} step={0.01}
              value={price}
              onChange={e => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="0"
              className="flex-1 text-sm focus:outline-none w-0 min-w-0"
            />
          </div>
        </div>
        <button
          onClick={submit}
          disabled={!title.trim() || price === ''}
          className="w-full py-2 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-40"
        >
          Add Item
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function EditOrderPanel({
  orderId,
  initialItems,
  initialShipping,
  initialDiscount,
}: {
  orderId: string
  initialItems: DraftItem[]
  initialShipping: number
  initialDiscount: number
}) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [items, setItems] = useState<DraftItem[]>(initialItems)
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const [shipping, setShipping] = useState(initialShipping)
  const [discount, setDiscount] = useState(initialDiscount)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [showSearch, setShowSearch] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)

  // Sync items/shipping/discount when server refreshes props after save
  useEffect(() => {
    if (!isEditing) {
      setItems(initialItems)
      setShipping(initialShipping)
      setDiscount(initialDiscount)
    }
  }, [initialItems, initialShipping, initialDiscount, isEditing])

  // Computed totals — always live
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const total = subtotal + shipping - discount

  // ── Edit mode enter / discard ────────────────────────────────────────────
  const enterEdit = () => {
    setItems(initialItems)
    setRemovedIds([])
    setShipping(initialShipping)
    setDiscount(initialDiscount)
    setSaveError(null)
    setShowSearch(false)
    setShowCustomForm(false)
    setIsEditing(true)
  }

  const discard = () => {
    setItems(initialItems)
    setRemovedIds([])
    setShipping(initialShipping)
    setDiscount(initialDiscount)
    setShowSearch(false)
    setShowCustomForm(false)
    setSaveError(null)
    setIsEditing(false)
  }

  // ── Item mutations ──────────────────────────────────────────────────────
  const removeItem = (idx: number) => {
    const item = items[idx]
    if (item.id) setRemovedIds(prev => [...prev, item.id!])
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  const updateQty = (idx: number, val: number) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: clampQty(val) } : it))

  const updatePrice = (idx: number, val: number) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, unit_price: val } : it))

  const updateTitle = (idx: number, val: string) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, title: val } : it))

  const addFromShopify = (product: ShopifyProductResult, variant: ShopifyVariant) => {
    setItems(prev => [...prev, {
      id:                 null,
      shopify_product_id: product.id.toString(),
      shopify_variant_id: variant.id.toString(),
      sku:                variant.sku,
      title:              product.title,
      variant_title:      variant.title !== 'Default Title' ? variant.title : null,
      quantity:           1,
      unit_price:         parseFloat(variant.price) || 0,
      image_url:          product.images[0]?.src ?? null,
      is_custom:          false,
    }])
    setShowSearch(false)
  }

  const addCustomItem = (item: DraftItem) => {
    setItems(prev => [...prev, item])
    setShowCustomForm(false)
  }

  // ── Save ────────────────────────────────────────────────────────────────
  const save = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const payload = {
        items:          items.map(it => ({
          id:                 it.id,
          shopify_product_id: it.shopify_product_id ?? null,
          shopify_variant_id: it.shopify_variant_id ?? null,
          sku:                it.sku ?? null,
          title:              it.title,
          variant_title:      it.variant_title ?? null,
          quantity:           it.quantity,
          unit_price:         it.unit_price,
          is_custom:          it.is_custom ?? false,
        })),
        removedItemIds: removedIds,
        shipping_price: shipping,
        discount_total: discount,
      }

      const res  = await fetch(`/api/orders/${orderId}/edit`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })

      const data = await res.json()
      console.log('[EditOrderPanel] save response:', data)

      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Server error ${res.status}`)
      }

      router.refresh()
      setIsEditing(false)
      setRemovedIds([])
      setShowSearch(false)
      setShowCustomForm(false)
      setSaving(false)

    } catch (e: any) {
      setSaveError(e.message)
      setSaving(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={`bg-white rounded-xl border p-5 transition-colors ${isEditing ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-gray-100'}`}>

      {/* ── Card header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm text-gray-900">Order Items</h2>
        {!isEditing ? (
          <button
            onClick={enterEdit}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Order
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={discard}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition disabled:opacity-40"
            >
              Discard
            </button>
            <button
              onClick={save}
              disabled={saving || items.length === 0}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-40 flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <svg className="animate-spin" width="12" height="12" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Save error — prominent banner */}
      {saveError && (
        <div className="mb-4 px-4 py-3 text-sm font-medium text-red-800 bg-red-50 border border-red-300 rounded-xl flex items-start gap-2">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <span>{saveError}</span>
        </div>
      )}

      {/* ── Item list ──────────────────────────────────────────────────── */}
      <div>
        {items.length === 0 && (
          <div className="py-6 text-center text-sm text-gray-400">No items — add a product below</div>
        )}
        {items.map((item, idx) => (
          <div
            key={item.id ?? `new-${idx}`}
            className={`flex items-center gap-3 ${idx > 0 ? 'pt-4 mt-4 border-t border-gray-50' : ''}`}
          >
            {/* Thumbnail */}
            <div className="shrink-0">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-14 h-14 object-cover rounded-lg border border-gray-100"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-xl">📦</div>
              )}
            </div>

            {/* Title + meta */}
            <div className="flex-1 min-w-0">
              {isEditing && item.is_custom ? (
                <input
                  value={item.title}
                  onChange={e => updateTitle(idx, e.target.value)}
                  className="w-full text-sm font-semibold text-gray-900 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400 mb-0.5"
                />
              ) : item.shopify_product_id ? (
                <Link href={`/admin/products/${item.shopify_product_id}`} className="font-semibold text-sm text-emerald-600 hover:underline truncate block">
                  {item.title}
                </Link>
              ) : (
                <div className="font-semibold text-sm text-gray-900 truncate">{item.title}</div>
              )}
              {item.variant_title && (
                <div className="text-xs text-gray-400 mt-0.5">{item.variant_title}</div>
              )}
              {item.sku && (
                <div className="text-xs text-gray-400">SKU: {item.sku}</div>
              )}
              {item.is_custom && (
                <span className="inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                  custom
                </span>
              )}
            </div>

            {/* Read mode: price summary */}
            {!isEditing && (
              <div className="text-right shrink-0">
                <div className="font-semibold text-sm text-gray-900">
                  MAD{(item.quantity * item.unit_price).toFixed(2)}
                </div>
                <div className="text-xs text-gray-400">
                  MAD{Number(item.unit_price).toFixed(2)} × {item.quantity}
                </div>
              </div>
            )}

            {/* Edit mode: qty stepper + price input + remove */}
            {isEditing && (
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Qty stepper */}
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-8">
                  <button
                    onClick={() => updateQty(idx, item.quantity - 1)}
                    className="w-7 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition font-medium select-none"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={e => updateQty(idx, parseInt(e.target.value) || 1)}
                    className="w-9 h-8 text-center text-sm border-x border-gray-200 focus:outline-none"
                  />
                  <button
                    onClick={() => updateQty(idx, item.quantity + 1)}
                    className="w-7 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition font-medium select-none"
                  >
                    +
                  </button>
                </div>

                {/* Unit price */}
                <div className="flex items-center border border-gray-200 rounded-lg h-8 px-2 gap-1">
                  <span className="text-[10px] text-gray-400">MAD</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.unit_price}
                    onChange={e => updatePrice(idx, parseFloat(e.target.value) || 0)}
                    className="w-16 text-sm text-right focus:outline-none"
                  />
                </div>

                {/* Line total preview */}
                <div className="w-20 text-right text-xs font-semibold text-gray-700 shrink-0">
                  MAD{(item.quantity * item.unit_price).toFixed(2)}
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(idx)}
                  className="w-7 h-7 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Remove item"
                >
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Add product / custom item buttons ──────────────────────────── */}
      {isEditing && (
        <div className="mt-4 flex gap-2 flex-wrap">
          <button
            onClick={() => { setShowSearch(s => !s); setShowCustomForm(false) }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-dashed rounded-lg transition ${
              showSearch
                ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
          <button
            onClick={() => { setShowCustomForm(s => !s); setShowSearch(false) }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-dashed rounded-lg transition ${
              showCustomForm
                ? 'border-gray-400 bg-gray-50 text-gray-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Custom Item
          </button>
        </div>
      )}

      {/* Product search panel */}
      {isEditing && showSearch && (
        <ProductSearchPanel
          onAdd={addFromShopify}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* Custom item form */}
      {isEditing && showCustomForm && (
        <CustomItemForm
          onAdd={addCustomItem}
          onClose={() => setShowCustomForm(false)}
        />
      )}

      {/* ── Price breakdown ─────────────────────────────────────────────── */}
      <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span className="font-medium">{mad(subtotal)}</span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Shipping</span>
          {isEditing ? (
            <div className="flex items-center border border-gray-200 rounded-lg h-7 px-2 gap-1">
              <span className="text-[10px] text-gray-400">MAD</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={shipping}
                onChange={e => setShipping(parseFloat(e.target.value) || 0)}
                className="w-16 text-sm text-right focus:outline-none"
              />
            </div>
          ) : (
            <span>+{mad(shipping)}</span>
          )}
        </div>

        {(discount > 0 || isEditing) && (
          <div className="flex items-center justify-between text-sm text-emerald-600">
            <span>Discount</span>
            {isEditing ? (
              <div className="flex items-center border border-gray-200 rounded-lg h-7 px-2 gap-1">
                <span className="text-[10px] text-gray-400">MAD</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={discount}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-16 text-sm text-right focus:outline-none"
                />
              </div>
            ) : (
              <span>−{mad(discount)}</span>
            )}
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-gray-50">
          <span className="text-base font-bold text-gray-900">Amount Due</span>
          <span className={`text-base font-bold ${isEditing ? 'text-emerald-600' : 'text-gray-900'}`}>
            {mad(total)}
          </span>
        </div>
      </div>

    </div>
  )
}
