'use client'

import { useState, useEffect } from 'react'

type Automation = {
  id: string
  name: string
  trigger_type: 'ameex_status' | 'order_status'
  trigger_value: string
  action_type: 'change_order_status' | 'send_whatsapp'
  action_value: string
  action_message?: string
  is_active: boolean
  run_count: number
}

const AMEEX_STATUSES = [
  { value: 'NEW_PARCEL', label: 'Nouveau Colis' },
  { value: 'PICKED_UP', label: 'Ramassé' },
  { value: 'IN_SHIPMENT', label: "En cours d'expédition" },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'DISTRIBUTION', label: 'Mise en distribution' },
  { value: 'DELIVERED', label: 'Livré' },
  { value: 'RETURNED', label: 'Retourné' },
  { value: 'POSTPONED', label: 'Reporté' },
  { value: 'NO_ANSWER', label: 'Pas de réponse' },
  { value: 'DISPOSITION', label: 'Mis à disposition' },
]

const ORDER_STATUSES = [
  { value: 'pending_confirmation', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmé' },
  { value: 'processing', label: 'En traitement' },
  { value: 'shipped', label: 'Expédié' },
  { value: 'delivered', label: 'Livré' },
  { value: 'returned', label: 'Retourné' },
  { value: 'canceled_confirmation', label: 'Annulé' },
]

const TRIGGER_ICON: Record<string, string> = {
  ameex_status: '📦',
  order_status: '🔄',
}

const ACTION_ICON: Record<string, string> = {
  change_order_status: '🔄',
  send_whatsapp: '💬',
}

const TRIGGER_COLOR: Record<string, string> = {
  ameex_status: 'bg-orange-100 text-orange-700 border-orange-200',
  order_status: 'bg-blue-100 text-blue-700 border-blue-200',
}

function getLabelAmeex(val: string) {
  return AMEEX_STATUSES.find(s => s.value === val)?.label || val
}
function getLabelOrder(val: string) {
  return ORDER_STATUSES.find(s => s.value === val)?.label || val
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    trigger_type: 'ameex_status' as 'ameex_status' | 'order_status',
    trigger_value: 'DELIVERED',
    action_type: 'change_order_status' as 'change_order_status' | 'send_whatsapp',
    action_value: 'delivered',
    action_message: '',
  })

  useEffect(() => {
    fetch('/api/automations')
      .then(r => r.json())
      .then(d => { setAutomations(d.automations); setLoading(false) })
  }, [])

  async function toggle(id: string, is_active: boolean) {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, is_active } : a))
    await fetch('/api/automations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active }),
    })
  }

  async function remove(id: string) {
    setAutomations(prev => prev.filter(a => a.id !== id))
    await fetch('/api/automations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await res.json()
    setSaving(false)
    if (d.automation) {
      setAutomations(prev => [...prev, d.automation])
      setShowForm(false)
      setForm({ name: '', trigger_type: 'ameex_status', trigger_value: 'DELIVERED', action_type: 'change_order_status', action_value: 'delivered', action_message: '' })
    }
  }

  const ameexAutos = automations.filter(a => a.trigger_type === 'ameex_status')
  const orderAutos = automations.filter(a => a.trigger_type === 'order_status')

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Automations</h1>
          <p className="text-xs text-gray-400 mt-0.5">Actions déclenchées automatiquement selon les événements</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle automation
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Ameex automations */}
          <Section
            title="📦 Ameex → Statut commande"
            description="Quand Ameex met à jour le statut, la commande se met à jour automatiquement"
            automations={ameexAutos}
            onToggle={toggle}
            onDelete={remove}
            getTriggerLabel={getLabelAmeex}
            getActionLabel={getLabelOrder}
          />

          {/* Order status automations */}
          <Section
            title="💬 Statut commande → WhatsApp"
            description="Envoyer un message WhatsApp quand le statut change"
            automations={orderAutos}
            onToggle={toggle}
            onDelete={remove}
            getTriggerLabel={getLabelOrder}
            getActionLabel={(v) => v}
          />
        </>
      )}

      {/* New automation form */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Nouvelle automation</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <form onSubmit={create} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nom</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Livré → Statut livré"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Déclencheur</label>
                    <select value={form.trigger_type}
                      onChange={e => {
                        const tt = e.target.value as any
                        setForm(f => ({ ...f, trigger_type: tt, trigger_value: tt === 'ameex_status' ? 'DELIVERED' : 'confirmed' }))
                      }}
                      className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
                      <option value="ameex_status">Statut Ameex</option>
                      <option value="order_status">Statut commande</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Valeur</label>
                    <select value={form.trigger_value}
                      onChange={e => setForm(f => ({ ...f, trigger_value: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
                      {(form.trigger_type === 'ameex_status' ? AMEEX_STATUSES : ORDER_STATUSES).map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
                    <select value={form.action_type}
                      onChange={e => setForm(f => ({ ...f, action_type: e.target.value as any }))}
                      className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
                      <option value="change_order_status">Changer statut</option>
                      <option value="send_whatsapp">Envoyer WhatsApp</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {form.action_type === 'change_order_status' ? 'Nouveau statut' : 'Template'}
                    </label>
                    {form.action_type === 'change_order_status' ? (
                      <select value={form.action_value}
                        onChange={e => setForm(f => ({ ...f, action_value: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
                        {ORDER_STATUSES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input value={form.action_value}
                        onChange={e => setForm(f => ({ ...f, action_value: e.target.value }))}
                        placeholder="order_confirmed"
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    )}
                  </div>
                </div>

                {form.action_type === 'send_whatsapp' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Message <span className="text-gray-400 font-normal">({'{name}'} et {'{order}'} disponibles)</span>
                    </label>
                    <textarea rows={3} value={form.action_message}
                      onChange={e => setForm(f => ({ ...f, action_message: e.target.value }))}
                      placeholder="مرحبا {name}، طلبك {order} تم تأكيده ✅"
                      dir="auto"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  </div>
                )}

                <button type="submit" disabled={saving}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition">
                  {saving ? 'Création...' : 'Créer l\'automation'}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Section({ title, description, automations, onToggle, onDelete, getTriggerLabel, getActionLabel }: {
  title: string
  description: string
  automations: Automation[]
  onToggle: (id: string, v: boolean) => void
  onDelete: (id: string) => void
  getTriggerLabel: (v: string) => string
  getActionLabel: (v: string) => string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      {automations.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">Aucune automation configurée</div>
      ) : (
        <div className="divide-y divide-gray-50">
          {automations.map(a => (
            <div key={a.id} className={`px-5 py-3.5 flex items-center gap-4 transition ${a.is_active ? '' : 'opacity-50'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">{a.name}</span>
                  {a.run_count > 0 && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{a.run_count}x</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                  <span className="bg-orange-50 text-orange-700 border border-orange-100 px-2 py-0.5 rounded-md font-medium">
                    {getTriggerLabel(a.trigger_value)}
                  </span>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gray-300 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md font-medium">
                    {a.action_type === 'send_whatsapp' ? '💬 WhatsApp' : getActionLabel(a.action_value)}
                  </span>
                </div>
                {a.action_message && (
                  <p className="text-xs text-gray-400 mt-1 truncate max-w-xs">{a.action_message}</p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => onToggle(a.id, !a.is_active)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${a.is_active ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${a.is_active ? 'left-4' : 'left-0.5'}`} />
                </button>
                <button onClick={() => onDelete(a.id)} className="text-gray-300 hover:text-red-400 transition">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
