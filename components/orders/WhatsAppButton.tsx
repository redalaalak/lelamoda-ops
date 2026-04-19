'use client'

import { useState } from 'react'

interface Props {
  orderId: string
  phone: string | null
  orderName?: string
  customerName?: string
}

const QUICK_MESSAGES = [
  { label: 'Confirmation', text: (name: string, order: string) => `مرحبا ${name}،\nتم تأكيد طلبك ${order} بنجاح ✅\nسنقوم بالتواصل معك قريبًا لتحديد موعد التسليم.` },
  { label: 'Expédié', text: (name: string, order: string) => `مرحبا ${name}،\nطلبك ${order} في الطريق إليك 🚚\nسيصلك خلال 24-48 ساعة.` },
  { label: 'Livraison', text: (name: string, order: string) => `مرحبا ${name}،\nالمندوب في طريقه إليك الآن لتسليم طلبك ${order} 📦` },
  { label: 'Non joignable', text: (name: string, order: string) => `مرحبا ${name}،\nحاولنا التواصل معك بخصوص طلبك ${order} لكن لم نتمكن من الوصول إليك. رجاءً تواصل معنا.` },
]

export default function WhatsAppButton({ orderId, phone, orderName = '', customerName = '' }: Props) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  if (!phone) return null

  async function send() {
    if (!message.trim()) return
    setSending(true); setError('')
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, phone, message }),
    })
    const d = await res.json()
    setSending(false)
    if (!res.ok) { setError(d.error || 'Erreur'); return }
    setSent(true)
    setTimeout(() => { setSent(false); setOpen(false); setMessage('') }, 2000)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#25D366] hover:bg-[#1fb955] text-white rounded-lg transition"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.107.547 4.084 1.508 5.806L0 24l6.344-1.486A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.661-.5-5.193-1.375L2.5 21.5l.91-4.173A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
        WhatsApp
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-20 bg-white border border-gray-200 rounded-xl shadow-lg w-80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">Envoyer WhatsApp</div>
                <div className="text-xs text-gray-400">{phone}</div>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Quick messages */}
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_MESSAGES.map(q => (
                <button
                  key={q.label}
                  onClick={() => setMessage(q.text(customerName || 'Client', orderName))}
                  className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 transition text-left"
                >
                  {q.label}
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              dir="auto"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              onClick={send}
              disabled={sending || !message.trim()}
              className="w-full py-2 bg-[#25D366] hover:bg-[#1fb955] disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition"
            >
              {sent ? '✓ Envoyé!' : sending ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
