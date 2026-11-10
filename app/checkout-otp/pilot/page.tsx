import { notFound } from 'next/navigation'
import PilotForm from './pilot-form'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'LelaModa | Vérification WhatsApp',
  robots: { index: false, follow: false },
}

export default function CheckoutOtpPilotPage() {
  if (process.env.CHECKOUT_OTP_PILOT !== '1' ||
      (process.env.VERCEL_ENV !== 'preview' && process.env.NODE_ENV !== 'development')) notFound()

  return (
    <main className="grid min-h-dvh place-items-center bg-stone-50 px-4 py-12 text-stone-900">
      <section aria-labelledby="otp-heading" className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-9">
        <p className="font-serif text-2xl font-bold">LelaModa.</p>
        <p className="mt-6 text-xs font-medium uppercase tracking-widest text-stone-500">Aperçu de test</p>
        <h1 id="otp-heading" className="mt-2 text-2xl font-semibold">Confirmez votre numéro WhatsApp</h1>
        <p className="mb-6 mt-2 text-sm text-stone-600">Recevez un code à six chiffres sur le numéro autorisé. Aucune commande ne sera créée.</p>
        <PilotForm />
      </section>
    </main>
  )
}
