'use client'

import { useState, type FormEvent } from 'react'

const fieldClass = 'w-full rounded-md border border-stone-300 px-3 py-2 focus:border-emerald-800 focus:outline-emerald-800'

export default function PilotForm() {
  const [accessKey, setAccessKey] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [verified, setVerified] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const input = challengeId ? { action: 'verify', challengeId, code } : { action: 'start', phone }
      const response = await fetch('/api/checkout-otp/pilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, accessKey }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'La vérification est indisponible.')
      if (data.verified === true) {
        setCode('')
        setAccessKey('')
        setVerified(true)
      } else if (typeof data.challengeId === 'string') {
        setChallengeId(data.challengeId)
      } else {
        throw new Error('Réponse inattendue. Réessayez.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setBusy(false)
    }
  }

  if (verified) {
    return <p role="status" className="rounded-md bg-emerald-50 px-4 py-3 text-emerald-900">Numéro WhatsApp vérifié.</p>
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {!challengeId ? (
        <>
          <label className="block text-sm font-medium">
            Clé de test
            <input type="password" autoComplete="off" required maxLength={128} value={accessKey}
              onChange={event => setAccessKey(event.target.value)} className={fieldClass} />
          </label>
          <label className="block text-sm font-medium">
            Numéro WhatsApp
            <input type="tel" autoComplete="tel" required maxLength={24} placeholder="+212 6 00 00 00 00"
              value={phone} onChange={event => setPhone(event.target.value)} className={fieldClass} />
          </label>
        </>
      ) : (
        <label className="block text-sm font-medium">
          Code à six chiffres reçu sur WhatsApp
          <input key="otp" type="text" autoComplete="one-time-code" inputMode="numeric" required
            pattern="[0-9]{6}" maxLength={6} value={code}
            onChange={event => setCode(event.target.value.replace(/[^0-9]/g, ''))} className={fieldClass} />
        </label>
      )}
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      <button type="submit" disabled={busy} className="w-full rounded-md bg-emerald-950 px-4 py-3 font-semibold text-white disabled:opacity-60">
        {busy ? 'Un instant…' : challengeId ? 'Vérifier le code' : 'Recevoir mon code'}
      </button>
      {challengeId && (
        <button type="button" disabled={busy} className="w-full text-sm underline"
          onClick={() => { setChallengeId(''); setCode(''); setError('') }}>
          Revenir au numéro
        </button>
      )}
    </form>
  )
}
