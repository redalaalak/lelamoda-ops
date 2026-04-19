'use client'

import { useState } from 'react'

interface Props {
  orderId: string
  parcelCode?: string | null
  parcelStatus?: string | null
  parcelStatusName?: string | null
  defaultCity?: string
  defaultPhone?: string
  defaultAddress?: string
  orderName?: string
}

const STATUS_COLOR: Record<string, string> = {
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  RETURNED: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DISTRIBUTION: 'bg-violet-100 text-violet-700',
  IN_SHIPMENT: 'bg-indigo-100 text-indigo-700',
  NEW_PARCEL: 'bg-gray-100 text-gray-600',
  PICKED_UP: 'bg-yellow-100 text-yellow-700',
  POSTPONED: 'bg-orange-100 text-orange-700',
  NO_ANSWER: 'bg-orange-100 text-orange-700',
}

export default function AmeexButton({
  orderId, parcelCode, parcelStatus, parcelStatusName,
  defaultCity = '', defaultPhone = '', defaultAddress = '', orderName = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [code, setCode] = useState(parcelCode || '')
  const [status, setStatus] = useState(parcelStatus || '')
  const [statusName, setStatusName] = useState(parcelStatusName || '')
  const [city, setCity] = useState(defaultCity)
  const [phone, setPhone] = useState(defaultPhone)
  const [address, setAddress] = useState(defaultAddress)
  const [comment, setComment] = useState('')
  const [open_parcel, setOpenParcel] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function createParcel() {
    setLoading(true); setError('')
    const res = await fetch('/api/ameex/parcel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, city_override: city, address_override: address, comment, open: open_parcel }),
    })
    const d = await res.json()
    setLoading(false)
    if (!res.ok) { setError(d.error); return }
    setCode(d.code)
    setStatus('NEW_PARCEL')
    setStatusName('Nouveau Colis')
    setSuccess(`Colis créé: ${d.code}`)
  }

  async function handleDelete() {
    setLoading(true)
    await fetch('/api/ameex/parcel', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, code }),
    })
    setCode(''); setStatus(''); setStatusName('')
    setConfirmDelete(false); setLoading(false)
    setSuccess('Colis supprimé')
  }

  async function handleRelaunch() {
    setLoading(true)
    await fetch('/api/ameex/parcel', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    setLoading(false)
    setSuccess('Colis relancé')
  }

  const colorClass = STATUS_COLOR[status] || 'bg-gray-100 text-gray-600'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition"
      >
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" />
        </svg>
        {code ? 'Ameex' : 'Envoyer Ameex'}
        {status && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${colorClass}`}>{statusName || status}</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-20 bg-white border border-gray-200 rounded-xl shadow-lg w-80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">Ameex Livraison</div>
                {orderName && <div className="text-xs text-gray-400">{orderName}</div>}
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {code ? (
              /* Already has parcel code */
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Code de suivi</span>
                    <button onClick={() => navigator.clipboard.writeText(code)} className="text-xs text-emerald-600 hover:text-emerald-700">Copier</button>
                  </div>
                  <div className="font-mono text-sm font-bold text-gray-900">{code}</div>
                  {status && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
                      {statusName || status}
                    </span>
                  )}
                </div>

                <a
                  href={`https://c.ameex.app/track/${code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Suivre sur Ameex ↗
                </a>

                <button
                  onClick={handleRelaunch}
                  disabled={loading}
                  className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition"
                >
                  {loading ? '...' : 'Relancer'}
                </button>

                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full py-1.5 text-xs text-red-500 hover:text-red-700 border border-red-100 hover:border-red-200 rounded-lg transition"
                  >
                    Supprimer le colis
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDelete(false)} className="flex-1 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
                    <button onClick={handleDelete} disabled={loading} className="flex-1 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50">Confirmer</button>
                  </div>
                )}
                {success && <p className="text-xs text-emerald-600">{success}</p>}
              </div>
            ) : (
              /* Create parcel form */
              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Ville</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Casablanca"
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0600000000"
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Adresse de livraison"
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Commentaire</label>
                  <input
                    type="text"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Optionnel"
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={open_parcel} onChange={e => setOpenParcel(e.target.checked)} className="accent-orange-500" />
                  <span className="text-xs text-gray-600">Colis ouvert (vérification client)</span>
                </label>

                {error && <p className="text-xs text-red-500">{error}</p>}
                {success && <p className="text-xs text-emerald-600">{success}</p>}

                <button
                  onClick={createParcel}
                  disabled={loading || !city}
                  className="w-full py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition"
                >
                  {loading ? 'Création...' : 'Créer le colis'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
