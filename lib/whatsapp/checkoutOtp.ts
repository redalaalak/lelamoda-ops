import { createHmac, randomInt, randomUUID } from 'node:crypto'

export const CHECKOUT_OTP_TTL_SECONDS = 5 * 60

const TEMPLATE_NAME = 'lelamoda_checkout_otp'
const TEMPLATE_BODY = 'Votre code de vérification est *{{1}}*.'

const SEND_TEMPLATE = `
  mutation SendCheckoutOtp($input: InboxSendConversationMessageInput!) {
    inboxSendConversationMessage(input: $input) {
      userErrors { code }
      message { id status }
    }
  }
`

export function normalizeMoroccanMobile(input: string): string | null {
  const compact = input.trim().replace(/[\s().-]/g, '')
  const national = compact.replace(/^(?:\+212|00212|212|0)/, '')
  return /^[67]\d{8}$/.test(national) ? `212${national}` : null
}

export function checkoutOtpDigest(
  secret: string,
  challengeId: string,
  phone: string,
  cartBinding: string,
  code: string,
): string {
  return createHmac('sha256', secret)
    .update(JSON.stringify(['lelamoda-checkout-otp-v1', challengeId, phone, cartBinding, code]))
    .digest('hex')
}

export function createCheckoutOtp(secret: string, phone: string, cartBinding: string) {
  if (Buffer.byteLength(secret) < 32) throw new Error('Checkout OTP secret must have at least 32 bytes')
  if (!/^212[67]\d{8}$/.test(phone) || !cartBinding) throw new Error('Invalid OTP challenge binding')

  const challengeId = randomUUID()
  const code = randomInt(1_000_000).toString().padStart(6, '0')
  return {
    challengeId,
    code,
    digest: checkoutOtpDigest(secret, challengeId, phone, cartBinding, code),
    expiresAt: new Date(Date.now() + CHECKOUT_OTP_TTL_SECONDS * 1000),
  }
}

type SendOtpInput = {
  accessToken: string
  integrationId: number
  connectionId: number
  templateId: string
  phone: string
  code: string
  challengeId: string
}

type SendOtpResponse = {
  errors?: unknown[]
  data?: {
    inboxSendConversationMessage?: {
      userErrors: { code: string | null }[]
      message: { id: number; status: string | null } | null
    } | null
  }
}

export async function sendCheckoutOtp({
  accessToken, integrationId, connectionId, templateId, phone, code, challengeId,
}: SendOtpInput) {
  if (!/^212[67]\d{8}$/.test(phone) || !/^\d{6}$/.test(code)) {
    throw new Error('Invalid checkout OTP destination or code')
  }

  // Match the eGrow Playground payload for the approved authentication template.
  // Pass the code for both the displayed text and the WhatsApp copy button.
  const parameter = { type: 'text', text: code }
  const response = await fetch('https://api5.egrow.com/graphql', {
    method: 'POST',
    headers: { 'X-API-Key': accessToken, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({
      query: SEND_TEMPLATE,
      variables: {
        input: {
          integrationId,
          userConnectionId: connectionId,
          externalCustomerId: phone,
          messageType: 'template',
          clientMessageId: challengeId,
          messageContent: {
            body: TEMPLATE_BODY,
            name: TEMPLATE_NAME,
            language: { code: 'fr' },
            components: [
              { type: 'body', parameters: [parameter] },
              { type: 'button', sub_type: 'url', index: '0', parameters: [parameter] },
            ],
          },
          messageTemplate: {
            id: templateId,
            name: TEMPLATE_NAME,
            language: 'fr',
            status: 'APPROVED',
            category: 'AUTHENTICATION',
          },
        },
      },
    }),
  })

  if (!response.ok) throw new Error(`eGrow checkout OTP request failed (${response.status})`)
  const body = (await response.json()) as SendOtpResponse
  const result = body.data?.inboxSendConversationMessage
  const message = result?.message
  if (body.errors?.length || result?.userErrors?.length || !message || message.status === 'failed') {
    throw new Error('eGrow did not accept the checkout OTP message')
  }
  return { messageId: message.id, status: message.status }
}
