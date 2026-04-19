'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      setStatus('success')
    } else {
      const data = await res.json()
      setErrorMsg(data.error || 'Une erreur est survenue')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-6 h-16 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">T</span>
          </div>
          <span className="font-bold text-gray-900">Tawsilak</span>
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Contactez-nous</h1>
        <p className="text-gray-500 mb-10">Une question ? Une demande de démo ? Notre équipe vous répond dans les 24h.</p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: '📧', label: 'Email', value: 'contact@tawsilak.com' },
            { icon: '💬', label: 'WhatsApp', value: '+212 6XX XXX XXX' },
            { icon: '📍', label: 'Adresse', value: 'Casablanca, Maroc' },
          ].map(c => (
            <div key={c.label} className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">{c.icon}</div>
              <div className="text-xs text-gray-400 mb-1">{c.label}</div>
              <div className="text-sm font-medium text-gray-700">{c.value}</div>
            </div>
          ))}
        </div>

        {status === 'success' ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Message envoyé !</h3>
            <p className="text-gray-500 text-sm">Nous vous répondrons dans les 24h.</p>
            <Link href="/" className="inline-block mt-4 text-emerald-600 text-sm font-medium hover:underline">← Retour à l'accueil</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Votre nom"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="vous@exemple.com"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Décrivez votre besoin..."
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
              />
            </div>

            {status === 'error' && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-red-600 text-sm">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {status === 'loading' ? 'Envoi en cours...' : 'Envoyer le message'}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">← Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  )
}
