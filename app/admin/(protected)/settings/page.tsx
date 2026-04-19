'use client'

import { useState } from 'react'

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSaved, setPwSaved] = useState(false)

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    if (pwForm.next !== pwForm.confirm) {
      setPwError('Les mots de passe ne correspondent pas')
      return
    }
    if (pwForm.next.length < 4) {
      setPwError('Minimum 4 caractères')
      return
    }
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
    })
    if (res.ok) {
      setPwSaved(true)
      setPwForm({ current: '', next: '', confirm: '' })
      setTimeout(() => setPwSaved(false), 3000)
    } else {
      const d = await res.json()
      setPwError(d.error || 'Erreur serveur')
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-400 mt-0.5">Configuration de votre compte admin</p>
      </div>

      {/* Store info */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Informations de la boutique</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Nom de la boutique</label>
            <input
              type="text"
              defaultValue="Tawsilak"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Domaine Shopify</label>
            <input
              type="text"
              placeholder="votre-boutique.myshopify.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Transporteur par défaut</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              <option value="ameex">Ameex</option>
              <option value="amana">Amana</option>
              <option value="colis_prive">Colis Privé</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000) }}
          className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {saved ? '✓ Enregistré' : 'Enregistrer'}
        </button>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Changer le mot de passe</h2>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Mot de passe actuel</label>
            <input
              type="password"
              required
              value={pwForm.current}
              onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Nouveau mot de passe</label>
            <input
              type="password"
              required
              value={pwForm.next}
              onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              required
              value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••••"
            />
          </div>
          {pwError && <p className="text-red-500 text-xs">{pwError}</p>}
          {pwSaved && <p className="text-emerald-600 text-xs">✓ Mot de passe modifié avec succès</p>}
          <button
            type="submit"
            className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Changer le mot de passe
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-100 p-6">
        <h2 className="text-sm font-semibold text-red-600 mb-1">Zone dangereuse</h2>
        <p className="text-xs text-gray-400 mb-4">Ces actions sont irréversibles.</p>
        <button className="border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Se déconnecter de toutes les sessions
        </button>
      </div>
    </div>
  )
}
