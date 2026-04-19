'use client'

import { useState } from 'react'

export default function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'duplicate'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (res.ok) {
      setStatus('success')
      setEmail('')
    } else {
      const data = await res.json()
      setStatus(data.error?.includes('déjà') ? 'duplicate' : 'error')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-white/10 border border-white/20 rounded-2xl px-8 py-6 max-w-md mx-auto text-center">
        <div className="text-3xl mb-2">🎉</div>
        <p className="text-white font-semibold">Vous êtes inscrit !</p>
        <p className="text-gray-400 text-sm mt-1">Nous vous contacterons très bientôt.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Votre email professionnel"
        className="flex-1 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors whitespace-nowrap"
      >
        {status === 'loading' ? '...' : 'Rejoindre la liste'}
      </button>
      {status === 'duplicate' && (
        <p className="absolute mt-14 text-yellow-400 text-xs">Cet email est déjà inscrit.</p>
      )}
      {status === 'error' && (
        <p className="absolute mt-14 text-red-400 text-xs">Une erreur est survenue, réessayez.</p>
      )}
    </form>
  )
}
