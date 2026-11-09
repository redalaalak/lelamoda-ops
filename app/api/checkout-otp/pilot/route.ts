import { createHash, timingSafeEqual } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  checkoutOtpDigest,
  createCheckoutOtp,
  normalizeMoroccanMobile,
  sendCheckoutOtp,
} from '@/lib/whatsapp/checkoutOtp'

const pilotBinding = 'lelamoda-otp-pilot'
const uuidPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i

function json(body: object, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

function matchesKey(supplied: string, expected: string) {
  const hash = (value: string) => createHash('sha256').update(value).digest()
  return timingSafeEqual(hash(supplied), hash(expected))
}

export async function POST(request: Request) {
  if (process.env.CHECKOUT_OTP_PILOT !== '1' ||
      (process.env.VERCEL_ENV !== 'preview' && process.env.NODE_ENV !== 'development')) {
    return json({ error: 'Ce test est désactivé.' }, 404)
  }

  const accessKey = process.env.CHECKOUT_OTP_TEST_ACCESS_KEY ?? ''
  const secret = process.env.CHECKOUT_OTP_HMAC_SECRET ?? ''
  const accessToken = process.env.EGROW_CHECKOUT_ACCESS_TOKEN
  const integrationId = Number(process.env.EGROW_CHECKOUT_INTEGRATION_ID)
  const connectionId = Number(process.env.EGROW_CHECKOUT_CONNECTION_ID)
  const templateId = process.env.EGROW_CHECKOUT_TEMPLATE_ID
  const testPhone = normalizeMoroccanMobile(process.env.CHECKOUT_OTP_TEST_PHONE ?? '')
  if (!testPhone || !accessToken || !templateId ||
      !Number.isSafeInteger(integrationId) || integrationId < 1 ||
      !Number.isSafeInteger(connectionId) || connectionId < 1 ||
      Buffer.byteLength(accessKey) < 32 || Buffer.byteLength(secret) < 32) {
    return json({ error: 'Le test WhatsApp est en cours de configuration.' }, 503)
  }

  if (request.headers.get('origin') !== new URL(request.url).origin ||
      !request.headers.get('content-type')?.startsWith('application/json')) {
    return json({ error: 'Requête non autorisée.' }, 403)
  }

  const raw = await request.text()
  if (raw.length > 1024) return json({ error: 'Requête trop longue.' }, 413)
  let input: Record<string, unknown>
  try {
    input = JSON.parse(raw)
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid payload')
  } catch {
    return json({ error: 'Requête invalide.' }, 400)
  }

  if (typeof input.accessKey !== 'string' || !matchesKey(input.accessKey, accessKey)) {
    return json({ error: 'Clé de test incorrecte.' }, 403)
  }

  if (input.action === 'start') {
    if (typeof input.phone !== 'string' || normalizeMoroccanMobile(input.phone) !== testPhone) {
      return json({ error: 'Utilisez le numéro WhatsApp autorisé pour le test.' }, 400)
    }

    const challenge = createCheckoutOtp(secret, testPhone, pilotBinding)
    const { data: reserved, error } = await supabaseAdmin.rpc('checkout_otp_pilot_reserve', {
      p_id: challenge.challengeId,
      p_digest: challenge.digest,
      p_expires_at: challenge.expiresAt.toISOString(),
    })
    if (error) {
      console.error('[checkout-otp-pilot] reserve failed', error.code)
      return json({ error: 'La vérification est temporairement indisponible.' }, 503)
    }
    if (!reserved) return json({ error: 'Trop de demandes. Réessayez dans quelques minutes.' }, 429)

    try {
      await sendCheckoutOtp({
        accessToken,
        integrationId,
        connectionId,
        templateId,
        phone: testPhone,
        code: challenge.code,
        challengeId: challenge.challengeId,
      })
      const { error: markError } = await supabaseAdmin.from('checkout_otp_pilot_challenges')
        .update({ sent: true }).eq('id', challenge.challengeId)
      if (markError) throw new Error('Could not mark challenge as sent')
    } catch {
      console.error('[checkout-otp-pilot] send failed')
      return json({ error: 'Le code n’a pas pu être envoyé. Réessayez dans une minute.' }, 502)
    }
    return json({ challengeId: challenge.challengeId })
  }

  if (input.action === 'verify' && typeof input.challengeId === 'string' &&
      uuidPattern.test(input.challengeId) && typeof input.code === 'string' && /^\d{6}$/.test(input.code)) {
    const { data: verified, error } = await supabaseAdmin.rpc('checkout_otp_pilot_verify', {
      p_id: input.challengeId,
      p_digest: checkoutOtpDigest(secret, input.challengeId, testPhone, pilotBinding, input.code),
    })
    if (error) {
      console.error('[checkout-otp-pilot] verify failed', error.code)
      return json({ error: 'La vérification est temporairement indisponible.' }, 503)
    }
    if (!verified) return json({ error: 'Code incorrect ou expiré. Demandez un nouveau code si nécessaire.' }, 400)
    return json({ verified: true })
  }

  return json({ error: 'Requête invalide.' }, 400)
}
