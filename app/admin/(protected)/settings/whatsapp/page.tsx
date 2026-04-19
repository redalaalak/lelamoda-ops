'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type WAConfig = {
  id: string
  phone_number: string
  display_name: string
  waba_id: string
  phone_number_id: string
  webhook_verify_token: string
  is_active: boolean
  created_at: string
} | null

export default function WhatsAppSettingsPage() {
  const [config, setConfig] = useState<WAConfig>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [testPhone, setTestPhone] = useState('')
  const [testMsg, setTestMsg] = useState('')
  const [testing, setTesting] = useState(false)
  const [showDisconnect, setShowDisconnect] = useState(false)

  const [form, setForm] = useState({
    phone_number_id: '',
    waba_id: '',
    access_token: '',
    phone_number: '',
    display_name: '',
  })

  useEffect(() => {
    fetch('/api/whatsapp/config')
      .then(r => r.json())
      .then(d => { setConfig(d.config); setLoading(false) })
  }, [])

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess('')
    const res = await fetch('/api/whatsapp/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await res.json()
    setSaving(false)
    if (!res.ok) { setError(d.error || 'Erreur'); return }
    setSuccess(`Connecté: ${d.display_name} (${d.phone_number})`)
    setConfig({ ...form, id: '', is_active: true, created_at: new Date().toISOString(), webhook_verify_token: '', ...d })
    setForm({ phone_number_id: '', waba_id: '', access_token: '', phone_number: '', display_name: '' })
  }

  async function handleDisconnect() {
    await fetch('/api/whatsapp/connect', { method: 'DELETE' })
    setConfig(null)
    setShowDisconnect(false)
  }

  async function handleTest(e: React.FormEvent) {
    e.preventDefault()
    if (!testPhone) return
    setTesting(true); setError(''); setSuccess('')
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone, message: testMsg || 'Bonjour depuis Tawsilak! 👋' }),
    })
    const d = await res.json()
    setTesting(false)
    if (!res.ok) { setError(d.error || 'Erreur envoi'); return }
    setSuccess('Message envoyé avec succès!')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tawsilak.com'
  const webhookUrl = `${appUrl}/api/whatsapp/webhook`

  if (loading) return (
    <div className="p-6 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/settings" className="text-gray-400 hover:text-gray-600">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">WhatsApp Business</h1>
          <p className="text-xs text-gray-400">Connectez votre numéro WhatsApp via Meta Cloud API</p>
        </div>
      </div>

      {/* Status */}
      {config ? (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#10b981">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.107.547 4.084 1.508 5.806L0 24l6.344-1.486A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.661-.5-5.193-1.375L2.5 21.5l.91-4.173A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{config.display_name || 'WhatsApp Business'}</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Connecté</span>
                </div>
                <span className="text-xs text-gray-500">{config.phone_number}</span>
              </div>
            </div>
            <button
              onClick={() => setShowDisconnect(true)}
              className="text-xs text-red-500 hover:text-red-700 border border-red-100 hover:border-red-200 px-3 py-1.5 rounded-lg transition"
            >
              Déconnecter
            </button>
          </div>

          {showDisconnect && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100 flex items-center justify-between gap-3">
              <span className="text-xs text-red-700">Confirmer la déconnexion?</span>
              <div className="flex gap-2">
                <button onClick={() => setShowDisconnect(false)} className="text-xs px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
                <button onClick={handleDisconnect} className="text-xs px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600">Oui, déconnecter</button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Setup guide */}
      {!config && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Comment obtenir vos credentials Meta?
          </div>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
            <li>Allez sur <strong>developers.facebook.com</strong> → Créer une App</li>
            <li>Ajoutez le produit <strong>WhatsApp</strong></li>
            <li>Dans WhatsApp → Configuration → copiez <strong>Phone Number ID</strong> et <strong>WhatsApp Business Account ID</strong></li>
            <li>Générez un <strong>System User Token</strong> permanent dans Meta Business Manager</li>
          </ol>
        </div>
      )}

      {/* Connect form */}
      {!config && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Connexion manuelle</h2>
          <form onSubmit={handleConnect} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone Number ID</label>
              <input
                type="text"
                required
                placeholder="1234567890123456"
                value={form.phone_number_id}
                onChange={e => setForm(f => ({ ...f, phone_number_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">WhatsApp Business Account ID (WABA ID)</label>
              <input
                type="text"
                required
                placeholder="1234567890123456"
                value={form.waba_id}
                onChange={e => setForm(f => ({ ...f, waba_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Access Token (System User)</label>
              <input
                type="password"
                required
                placeholder="EAAxxxxxxxxxxxxxxx..."
                value={form.access_token}
                onChange={e => setForm(f => ({ ...f, access_token: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            {success && <p className="text-xs text-emerald-600">{success}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
            >
              {saving ? 'Vérification...' : 'Connecter WhatsApp'}
            </button>
          </form>
        </div>
      )}

      {/* Webhook config */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-1">Configuration Webhook</h2>
        <p className="text-xs text-gray-400 mb-4">Configurez ces valeurs dans votre Meta App → WhatsApp → Configuration</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Webhook URL</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 break-all">
                {webhookUrl}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(webhookUrl)}
                className="shrink-0 text-xs text-emerald-600 hover:text-emerald-700 border border-emerald-200 px-2 py-2 rounded-lg hover:bg-emerald-50 transition"
              >
                Copier
              </button>
            </div>
          </div>
          {config && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Verify Token</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-700">
                  {config.webhook_verify_token}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(config.webhook_verify_token)}
                  className="shrink-0 text-xs text-emerald-600 border border-emerald-200 px-2 py-2 rounded-lg hover:bg-emerald-50 transition"
                >
                  Copier
                </button>
              </div>
            </div>
          )}
          <div className="text-xs text-gray-500">
            <strong>Webhook fields à souscrire:</strong> <code className="bg-gray-100 px-1 rounded">messages</code>
          </div>
        </div>
      </div>

      {/* Test message */}
      {config && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Envoyer un message test</h2>
          <form onSubmit={handleTest} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Numéro WhatsApp</label>
              <input
                type="text"
                required
                placeholder="0612345678"
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Message</label>
              <textarea
                rows={3}
                placeholder="Bonjour depuis Tawsilak!"
                value={testMsg}
                onChange={e => setTestMsg(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            {success && <p className="text-xs text-emerald-600">{success}</p>}
            <button
              type="submit"
              disabled={testing}
              className="py-2 px-4 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
            >
              {testing ? 'Envoi...' : 'Envoyer test'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
