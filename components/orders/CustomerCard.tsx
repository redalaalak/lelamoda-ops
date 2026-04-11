'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────
export type CustomerCardCustomer = {
  id: string
  full_name:    string | null
  first_name:   string | null
  last_name:    string | null
  email:        string | null
  phone:        string | null
  city:         string | null
  country_code: string | null
  is_blocked:   boolean
  created_at:   string
}

export type CustomerCardShipping = {
  first_name:   string | null
  last_name:    string | null
  phone:        string | null
  address1:     string | null
  address2:     string | null
  city:         string | null
  province:     string | null
  zip:          string | null
  country_code: string | null
}

// ── Helpers ────────────────────────────────────────────────────────────────
function initials(name: string | null | undefined): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase()
}

const PALETTE = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100   text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100  text-amber-700',
  'bg-rose-100   text-rose-700',
  'bg-cyan-100   text-cyan-700',
]
function avatarColor(name: string | null | undefined) {
  if (!name) return 'bg-gray-100 text-gray-500'
  const n = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  return PALETTE[n % PALETTE.length]
}

// ── API helper ─────────────────────────────────────────────────────────────
async function patchCustomer(orderId: string, body: Record<string, unknown>) {
  const res  = await fetch(`/api/orders/${orderId}/customer`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok || !data.ok) throw new Error(data.error ?? 'Request failed')
  return data
}

// ── Modal shell ────────────────────────────────────────────────────────────
function Modal({
  title, onClose, children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* body */}
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ── Shared form primitives ─────────────────────────────────────────────────
const iCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 placeholder-gray-300'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

function ErrBanner({ msg }: { msg: string | null }) {
  if (!msg) return null
  return (
    <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
      <span className="shrink-0">⚠</span> {msg}
    </div>
  )
}

function ModalActions({
  onCancel,
  onSave,
  saving,
  saveLabel = 'Save',
}: {
  onCancel: () => void
  onSave: () => void
  saving: boolean
  saveLabel?: string
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onCancel}
        className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="flex-1 py-2 text-sm font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50"
      >
        {saving ? 'Saving…' : saveLabel}
      </button>
    </div>
  )
}

// ── Edit Contact ───────────────────────────────────────────────────────────
function EditContactModal({
  customer, orderPhone, orderEmail, orderId, onClose,
}: {
  customer:   CustomerCardCustomer | null
  orderPhone: string | null
  orderEmail: string | null
  orderId:    string
  onClose:    () => void
}) {
  const nameParts = (customer?.full_name ?? '').split(' ')

  const [firstName, setFirstName] = useState(customer?.first_name ?? nameParts[0] ?? '')
  const [lastName,  setLastName]  = useState(customer?.last_name  ?? nameParts.slice(1).join(' ') ?? '')
  const [phone,     setPhone]     = useState(customer?.phone ?? orderPhone ?? '')
  const [email,     setEmail]     = useState(customer?.email ?? orderEmail ?? '')
  const [saving,    setSaving]    = useState(false)
  const [err,       setErr]       = useState<string | null>(null)

  const save = async () => {
    setSaving(true); setErr(null)
    try {
      await patchCustomer(orderId, { action: 'update_contact', firstName, lastName, phone, email })
      window.location.reload()
    } catch (e: any) { setErr(e.message); setSaving(false) }
  }

  return (
    <Modal title="Edit contact information" onClose={onClose}>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <input className={iCls} value={firstName} onChange={e => setFirstName(e.target.value)} />
          </Field>
          <Field label="Last name">
            <input className={iCls} value={lastName} onChange={e => setLastName(e.target.value)} />
          </Field>
        </div>
        <Field label="Phone">
          <input className={iCls} type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
        </Field>
        <Field label="Email">
          <input className={iCls} type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </Field>
        <ErrBanner msg={err} />
        <ModalActions onCancel={onClose} onSave={save} saving={saving} />
      </div>
    </Modal>
  )
}

// ── Edit Shipping ──────────────────────────────────────────────────────────
function EditShippingModal({
  shipping, orderId, onClose,
}: {
  shipping: CustomerCardShipping
  orderId:  string
  onClose:  () => void
}) {
  const [firstName,   setFirstName]   = useState(shipping.first_name   ?? '')
  const [lastName,    setLastName]    = useState(shipping.last_name    ?? '')
  const [phone,       setPhone]       = useState(shipping.phone        ?? '')
  const [address1,    setAddress1]    = useState(shipping.address1     ?? '')
  const [address2,    setAddress2]    = useState(shipping.address2     ?? '')
  const [city,        setCity]        = useState(shipping.city         ?? '')
  const [province,    setProvince]    = useState(shipping.province     ?? '')
  const [zip,         setZip]         = useState(shipping.zip          ?? '')
  const [countryCode, setCountryCode] = useState(shipping.country_code ?? 'MA')
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState<string | null>(null)

  const save = async () => {
    setSaving(true); setErr(null)
    try {
      await patchCustomer(orderId, {
        action: 'update_shipping',
        firstName, lastName, phone, address1, address2, city, province, zip, countryCode,
      })
      window.location.reload()
    } catch (e: any) { setErr(e.message); setSaving(false) }
  }

  return (
    <Modal title="Edit shipping address" onClose={onClose}>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <input className={iCls} value={firstName} onChange={e => setFirstName(e.target.value)} />
          </Field>
          <Field label="Last name">
            <input className={iCls} value={lastName} onChange={e => setLastName(e.target.value)} />
          </Field>
        </div>
        <Field label="Phone">
          <input className={iCls} type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
        </Field>
        <Field label="Address line 1">
          <input className={iCls} value={address1} onChange={e => setAddress1(e.target.value)} placeholder="Street address" />
        </Field>
        <Field label="Address line 2 (optional)">
          <input className={iCls} value={address2} onChange={e => setAddress2(e.target.value)} placeholder="Apartment, suite, etc." />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City">
            <input className={iCls} value={city} onChange={e => setCity(e.target.value)} />
          </Field>
          <Field label="Province / Region">
            <input className={iCls} value={province} onChange={e => setProvince(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ZIP / Postal code">
            <input className={iCls} value={zip} onChange={e => setZip(e.target.value)} />
          </Field>
          <Field label="Country code">
            <input className={iCls} value={countryCode} onChange={e => setCountryCode(e.target.value.toUpperCase())} maxLength={3} placeholder="MA" />
          </Field>
        </div>
        <ErrBanner msg={err} />
        <ModalActions onCancel={onClose} onSave={save} saving={saving} />
      </div>
    </Modal>
  )
}

// ── Change Customer ────────────────────────────────────────────────────────
function ChangeCustomerModal({
  orderId, onClose,
}: {
  orderId: string
  onClose: () => void
}) {
  const [q,       setQ]       = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const search = useCallback(async (query: string) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/customers?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.customers ?? [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => search(q), 300)
    return () => clearTimeout(timer.current)
  }, [q, search])

  const select = async (customerId: string) => {
    setSaving(true); setErr(null)
    try {
      await patchCustomer(orderId, { action: 'link', customerId })
      window.location.reload()
    } catch (e: any) { setErr(e.message); setSaving(false) }
  }

  return (
    <Modal title="Change customer" onClose={onClose}>
      <div className="p-5 space-y-3">
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by name or phone…"
          className={iCls}
        />

        <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
          {loading && <div className="px-4 py-3 text-xs text-gray-400">Searching…</div>}
          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-xs text-gray-400">
              {q ? `No results for "${q}"` : 'Type to search customers'}
            </div>
          )}
          {results.map(c => (
            <button
              key={c.id}
              onClick={() => select(c.id)}
              disabled={saving}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition border-b border-gray-50 last:border-0 disabled:opacity-50"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColor(c.full_name)}`}>
                {initials(c.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{c.full_name || '(no name)'}</div>
                <div className="text-xs text-gray-400">{c.phone || c.email || '—'}</div>
              </div>
            </button>
          ))}
        </div>

        <ErrBanner msg={err} />
      </div>
    </Modal>
  )
}

// ── Add New Customer ───────────────────────────────────────────────────────
function AddCustomerModal({
  orderId, onClose,
}: {
  orderId: string
  onClose: () => void
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [phone,     setPhone]     = useState('')
  const [email,     setEmail]     = useState('')
  const [city,      setCity]      = useState('')
  const [saving,    setSaving]    = useState(false)
  const [err,       setErr]       = useState<string | null>(null)

  const save = async () => {
    if (!firstName.trim() && !lastName.trim() && !phone.trim()) {
      setErr('Please enter at least a name or phone number')
      return
    }
    setSaving(true); setErr(null)
    try {
      await patchCustomer(orderId, { action: 'create_and_link', firstName, lastName, phone, email, city })
      window.location.reload()
    } catch (e: any) { setErr(e.message); setSaving(false) }
  }

  return (
    <Modal title="Add new customer" onClose={onClose}>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <input autoFocus className={iCls} value={firstName} onChange={e => setFirstName(e.target.value)} />
          </Field>
          <Field label="Last name">
            <input className={iCls} value={lastName} onChange={e => setLastName(e.target.value)} />
          </Field>
        </div>
        <Field label="Phone">
          <input className={iCls} type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
        </Field>
        <Field label="Email (optional)">
          <input className={iCls} type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </Field>
        <Field label="City (optional)">
          <input className={iCls} value={city} onChange={e => setCity(e.target.value)} />
        </Field>
        <ErrBanner msg={err} />
        <ModalActions onCancel={onClose} onSave={save} saving={saving} saveLabel="Create & Link" />
      </div>
    </Modal>
  )
}

// ── Remove Customer Confirm ────────────────────────────────────────────────
function RemoveConfirm({
  orderId, onClose,
}: {
  orderId: string
  onClose: () => void
}) {
  const [removing, setRemoving] = useState(false)
  const [err,      setErr]      = useState<string | null>(null)

  const remove = async () => {
    setRemoving(true); setErr(null)
    try {
      await patchCustomer(orderId, { action: 'unlink' })
      window.location.reload()
    } catch (e: any) { setErr(e.message); setRemoving(false) }
  }

  return (
    <Modal title="Remove customer" onClose={onClose}>
      <div className="p-5 space-y-4">
        <p className="text-sm text-gray-600">
          This will unlink the customer profile from this order. The order data and
          shipping address remain unchanged. You can re-link a customer at any time.
        </p>
        <ErrBanner msg={err} />
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={remove}
            disabled={removing}
            className="flex-1 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
          >
            {removing ? 'Removing…' : 'Remove customer'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Main CustomerCard ──────────────────────────────────────────────────────
type Modal =
  | 'edit_contact'
  | 'edit_shipping'
  | 'edit_billing'
  | 'change_customer'
  | 'add_customer'
  | 'remove_customer'

export default function CustomerCard({
  orderId,
  customer,
  orderCustomerName,
  orderCustomerPhone,
  orderCustomerEmail,
  shipping,
  totalOrders,
  returnedOrders,
}: {
  orderId:            string
  customer:           CustomerCardCustomer | null
  orderCustomerName:  string | null
  orderCustomerPhone: string | null
  orderCustomerEmail: string | null
  shipping:           CustomerCardShipping
  totalOrders:        number
  returnedOrders:     number
}) {
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [activeModal, setActiveModal] = useState<Modal | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  const openModal = (m: Modal) => { setActiveModal(m); setMenuOpen(false) }
  const closeModal = () => setActiveModal(null)

  // Display values — prefer linked customer, fall back to order fields
  const displayName  = customer?.full_name  || orderCustomerName  || '(no customer)'
  const displayPhone = customer?.phone      || orderCustomerPhone || null
  const displayEmail = customer?.email      || orderCustomerEmail || null

  const shippingName   = [shipping.first_name, shipping.last_name].filter(Boolean).join(' ') || null
  const whatsappNumber = (displayPhone ?? '').replace(/[^0-9]/g, '')

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 p-5">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm text-gray-900">Customer</h2>

          {/* 3-dots menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              aria-label="Customer actions"
            >
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 w-52 text-sm">
                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 transition" onClick={() => openModal('edit_contact')}>
                  Edit contact information
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 transition" onClick={() => openModal('edit_shipping')}>
                  Edit shipping address
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 transition" onClick={() => openModal('edit_billing')}>
                  Edit billing address
                </button>
                <div className="my-1 h-px bg-gray-100 mx-3" />
                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 transition" onClick={() => openModal('change_customer')}>
                  Change customer
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 transition" onClick={() => openModal('add_customer')}>
                  Add new customer
                </button>
                {customer && (
                  <>
                    <div className="my-1 h-px bg-gray-100 mx-3" />
                    <button className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-500 transition" onClick={() => openModal('remove_customer')}>
                      Remove customer
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Customer identity ───────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor(displayName)}`}>
            {initials(displayName)}
          </div>
          <div className="flex-1 min-w-0">
            {customer ? (
              <Link
                href={`/customers/${customer.id}`}
                className="text-sm font-semibold text-emerald-600 hover:underline block truncate"
              >
                {displayName}
              </Link>
            ) : (
              <div className="text-sm font-semibold text-gray-800 truncate">{displayName}</div>
            )}
            <div className="flex items-center gap-1.5 mt-0.5">
              {customer?.is_blocked ? (
                <span className="text-[10px] font-medium px-1.5 py-0.5 bg-red-100 text-red-600 rounded">Blocked</span>
              ) : customer ? (
                <span className="text-[10px] font-medium px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded">Active</span>
              ) : (
                <span className="text-[10px] text-gray-400">Not linked to profile</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Contact details ─────────────────────────────────────────── */}
        <div className="space-y-2 mb-4">
          {displayPhone && (
            <div className="flex items-center gap-2.5">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gray-300 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-sm text-gray-700">{displayPhone}</span>
            </div>
          )}
          {displayEmail && (
            <div className="flex items-center gap-2.5">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gray-300 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-500 truncate">{displayEmail}</span>
            </div>
          )}
          {!displayPhone && !displayEmail && (
            <p className="text-xs text-gray-400 italic">No contact details</p>
          )}
        </div>

        {/* ── Action buttons ──────────────────────────────────────────── */}
        {displayPhone && (
          <div className="flex gap-2 mb-5">
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#16a34a">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.104.544 4.078 1.5 5.797L0 24l6.386-1.478A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.866 9.866 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374A9.847 9.847 0 012.118 12C2.118 6.534 6.534 2.118 12 2.118S21.882 6.534 21.882 12 17.466 21.882 12 21.882z"/>
              </svg>
              WhatsApp
            </a>
            <a
              href={`tel:${displayPhone}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call
            </a>
          </div>
        )}

        {/* ── Shipping Address ─────────────────────────────────────────── */}
        <div className="border-t border-gray-50 pt-4 mb-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Shipping Address</span>
            <button
              onClick={() => openModal('edit_shipping')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition"
            >
              Edit
            </button>
          </div>
          <div className="space-y-0.5 text-sm text-gray-700">
            {shippingName && <div className="font-medium">{shippingName}</div>}
            {shipping.phone && <div className="text-gray-500 text-xs">{shipping.phone}</div>}
            {shipping.address1 && <div>{shipping.address1}</div>}
            {shipping.address2 && <div>{shipping.address2}</div>}
            {(shipping.city || shipping.province) && (
              <div className="text-gray-500">
                {[shipping.city, shipping.province].filter(Boolean).join(', ')}
                {shipping.zip ? ` ${shipping.zip}` : ''}
              </div>
            )}
            {shipping.country_code && <div className="text-xs text-gray-400">{shipping.country_code}</div>}
            {!shipping.address1 && !shipping.city && (
              <div className="text-xs text-gray-400 italic">No shipping address on record</div>
            )}
          </div>
        </div>

        {/* ── Billing Address ──────────────────────────────────────────── */}
        <div className="border-t border-gray-50 pt-4 mb-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Billing Address</span>
            <button
              onClick={() => openModal('edit_billing')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition"
            >
              Edit
            </button>
          </div>
          <div className="text-xs text-gray-400 italic">Same as shipping address</div>
        </div>

        {/* ── Customer Lifetime ────────────────────────────────────────── */}
        <div className="border-t border-gray-50 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Customer Lifetime</span>
            {customer && (
              <Link href={`/customers/${customer.id}`} className="text-xs text-emerald-600 hover:underline font-medium">
                View profile
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="text-xl font-bold text-gray-900">{totalOrders}</div>
              <div className="text-xs text-gray-400 mt-0.5">Orders</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="text-xl font-bold text-gray-900">{returnedOrders}</div>
              <div className="text-xs text-gray-400 mt-0.5">Returned</div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {activeModal === 'edit_contact' && (
        <EditContactModal
          customer={customer}
          orderPhone={orderCustomerPhone}
          orderEmail={orderCustomerEmail}
          orderId={orderId}
          onClose={closeModal}
        />
      )}
      {(activeModal === 'edit_shipping' || activeModal === 'edit_billing') && (
        <EditShippingModal shipping={shipping} orderId={orderId} onClose={closeModal} />
      )}
      {activeModal === 'change_customer' && (
        <ChangeCustomerModal orderId={orderId} onClose={closeModal} />
      )}
      {activeModal === 'add_customer' && (
        <AddCustomerModal orderId={orderId} onClose={closeModal} />
      )}
      {activeModal === 'remove_customer' && (
        <RemoveConfirm orderId={orderId} onClose={closeModal} />
      )}
    </>
  )
}
