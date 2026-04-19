'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const AMEEX_STATUSES = [
  { value: 'NEW_PARCEL',        label: 'Nouveau Colis',              group: 'transit' },
  { value: 'WAITING_PICKUP',    label: 'Attente Ramassage',          group: 'transit' },
  { value: 'PICKED_UP',         label: 'Ramassé',                    group: 'transit' },
  { value: 'RECEIVED',          label: 'Reçu (entrepôt)',            group: 'transit' },
  { value: 'IN_SHIPMENT',       label: "En cours d'expédition",      group: 'transit' },
  { value: 'IN_PROGRESS',       label: 'En cours',                   group: 'transit' },
  { value: 'SENT',              label: 'Expédié',                    group: 'transit' },
  { value: 'TRAVELLING',        label: 'En Voyage',                  group: 'transit' },
  { value: 'SCHEDULED',         label: 'Programmé',                  group: 'transit' },
  { value: 'CONFIRMED_BY_LIVREUR', label: 'Confirmé Par Livreur',   group: 'transit' },
  { value: 'DISTRIBUTION',      label: 'Mise en distribution',       group: 'delivery' },
  { value: 'DISPOSITION',       label: 'Mis à disposition',          group: 'delivery' },
  { value: 'DELIVERED',         label: 'Livré ✅',                   group: 'delivery' },
  { value: 'NO_ANSWER',         label: 'Pas de réponse',             group: 'followup' },
  { value: 'NO_ANSWER_SMS',     label: 'Pas de réponse + SMS',       group: 'followup' },
  { value: 'NO_ANSWER_TEAM',    label: 'Pas de réponse (Suivi)',     group: 'followup' },
  { value: 'POSTPONED',         label: 'Reporté',                    group: 'followup' },
  { value: 'POSTPONED_TEAM',    label: 'Reporté (Suivi)',            group: 'followup' },
  { value: 'UNREACHABLE',       label: 'Injoignable',                group: 'followup' },
  { value: 'UNREACHABLE_TEAM',  label: 'Injoignable (Suivi)',        group: 'followup' },
  { value: 'VOICEMAIL',         label: 'Boîte vocale',               group: 'followup' },
  { value: 'VOICEMAIL_TEAM',    label: 'Boîte vocale (Suivi)',       group: 'followup' },
  { value: 'OUT_OF_AREA',       label: 'Hors-zone',                  group: 'followup' },
  { value: 'RELAUNCH',          label: 'Relancer',                   group: 'followup' },
  { value: 'RELAUNCH_TEAM',     label: 'Relancer (Suivi)',           group: 'followup' },
  { value: 'WRONG_NUMBER',      label: 'Numéro Incorrect',           group: 'followup' },
  { value: 'REFUSE',            label: 'Refusé',                     group: 'return' },
  { value: 'PREPAR_RETURN',     label: 'Préparation Retour',         group: 'return' },
  { value: 'RETURNED',          label: 'Retourné',                   group: 'return' },
  { value: 'REFUNDED',          label: 'Remboursé',                  group: 'return' },
  { value: 'CANCELED',          label: 'Annulé',                     group: 'cancel' },
  { value: 'CANCELED_TEAM',     label: 'Annulé (Suivi)',             group: 'cancel' },
  { value: 'DOESNT_ORDER',      label: "Client n'a pas commandé",    group: 'cancel' },
]

const ORDER_STATUSES = [
  { value: '',                     label: '— Ne pas changer —' },
  { value: 'processing',           label: 'Processing' },
  { value: 'shipped',              label: 'Shipped (Expédié)' },
  { value: 'delivered',            label: 'Delivered (Livré)' },
  { value: 'returned',             label: 'Returned (Retourné)' },
  { value: 'follow_up',            label: 'Follow Up' },
  { value: 'canceled_confirmation',label: 'Canceled (Annulé)' },
  { value: 'to_edit',              label: 'To Edit' },
]

const GROUPS: Record<string, { label: string; color: string }> = {
  transit:  { label: '🚚 En transit',          color: 'bg-blue-50 border-blue-200' },
  delivery: { label: '📦 Livraison',            color: 'bg-emerald-50 border-emerald-200' },
  followup: { label: '📞 Suivi requis',         color: 'bg-orange-50 border-orange-200' },
  return:   { label: '↩️ Retour / Refus',       color: 'bg-red-50 border-red-200' },
  cancel:   { label: '❌ Annulation',            color: 'bg-gray-50 border-gray-200' },
}

type Mapping = Record<string, string> // ameex_status → order_status

export default function AmeexMappingPage() {
  const [mapping, setMapping] = useState<Mapping>({})
  const [automationIds, setAutomationIds] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/automations')
      .then(r => r.json())
      .then(d => {
        const m: Mapping = {}
        const ids: Record<string, string> = {}
        for (const a of d.automations) {
          if (a.trigger_type === 'ameex_status' && a.action_type === 'change_order_status') {
            m[a.trigger_value] = a.action_value
            ids[a.trigger_value] = a.id
          }
        }
        setMapping(m)
        setAutomationIds(ids)
        setLoading(false)
      })
  }, [])

  async function updateMapping(ameexStatus: string, orderStatus: string) {
    setSaving(ameexStatus)
    const existingId = automationIds[ameexStatus]

    if (!orderStatus) {
      // Delete automation if exists
      if (existingId) {
        await fetch('/api/automations', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: existingId }),
        })
        const newIds = { ...automationIds }
        delete newIds[ameexStatus]
        setAutomationIds(newIds)
      }
    } else if (existingId) {
      // Update via PATCH (toggle) — for now just update via delete + create
      await fetch('/api/automations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: existingId }),
      })
      const ameexLabel = AMEEX_STATUSES.find(s => s.value === ameexStatus)?.label || ameexStatus
      const orderLabel = ORDER_STATUSES.find(s => s.value === orderStatus)?.label || orderStatus
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Ameex ${ameexLabel} → ${orderLabel}`,
          trigger_type: 'ameex_status',
          trigger_value: ameexStatus,
          action_type: 'change_order_status',
          action_value: orderStatus,
        }),
      })
      const d = await res.json()
      if (d.automation) setAutomationIds(prev => ({ ...prev, [ameexStatus]: d.automation.id }))
    } else {
      // Create new
      const ameexLabel = AMEEX_STATUSES.find(s => s.value === ameexStatus)?.label || ameexStatus
      const orderLabel = ORDER_STATUSES.find(s => s.value === orderStatus)?.label || orderStatus
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Ameex ${ameexLabel} → ${orderLabel}`,
          trigger_type: 'ameex_status',
          trigger_value: ameexStatus,
          action_type: 'change_order_status',
          action_value: orderStatus,
        }),
      })
      const d = await res.json()
      if (d.automation) setAutomationIds(prev => ({ ...prev, [ameexStatus]: d.automation.id }))
    }

    setMapping(prev => ({ ...prev, [ameexStatus]: orderStatus }))
    setSaving(null)
    setSaved(ameexStatus)
    setTimeout(() => setSaved(null), 1500)
  }

  const grouped = Object.entries(GROUPS).map(([key, meta]) => ({
    key, meta,
    statuses: AMEEX_STATUSES.filter(s => s.group === key),
  }))

  return (
    <div className="p-6 max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/settings" className="text-gray-400 hover:text-gray-600">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Ameex — Mapping des statuts</h1>
          <p className="text-xs text-gray-400 mt-0.5">Chaque statut Ameex met à jour automatiquement le statut de la commande</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        grouped.map(({ key, meta, statuses }) => (
          <div key={key} className={`rounded-xl border ${meta.color} overflow-hidden`}>
            <div className="px-4 py-3 border-b border-inherit">
              <h2 className="text-sm font-semibold text-gray-800">{meta.label}</h2>
            </div>
            <div className="divide-y divide-inherit">
              {statuses.map(s => {
                const current = mapping[s.value] || ''
                const isSaving = saving === s.value
                const isSaved = saved === s.value
                return (
                  <div key={s.value} className="flex items-center justify-between px-4 py-2.5 bg-white/60">
                    <div>
                      <span className="text-sm text-gray-800">{s.label}</span>
                      <span className="ml-2 text-xs text-gray-400 font-mono">{s.value}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSaved && <span className="text-xs text-emerald-600">✓</span>}
                      {isSaving && <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />}
                      <select
                        value={current}
                        onChange={e => updateMapping(s.value, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 min-w-[160px]"
                      >
                        {ORDER_STATUSES.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
