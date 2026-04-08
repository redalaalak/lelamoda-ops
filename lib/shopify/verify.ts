import crypto from 'crypto';

export function verifyShopifyWebhook(rawBody: string, hmacHeader: string | null) {
  if (!hmacHeader || !process.env.SHOPIFY_WEBHOOK_SECRET) {
    return false;
  }

  const digest = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(rawBody, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
}
