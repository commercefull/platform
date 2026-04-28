/**
 * Adyen Gateway Adapter
 * https://docs.adyen.com/development-resources/webhooks/verify-hmac-signatures
 */

import * as crypto from 'crypto';
import { GatewayAdapter, WebhookEvent } from '../GatewayAdapter';

export class AdyenAdapter implements GatewayAdapter {
  readonly provider = 'adyen';

  verifySignature(rawBody: Buffer, headers: Record<string, string | string[] | undefined>, secret: string): boolean {
    // Adyen sends HMAC in the payload itself: notificationItems[0].NotificationRequestItem.additionalData.hmacSignature
    // For simplicity we also support X-Webhook-Signature as a fallback
    const header = headers['x-webhook-signature'] as string | undefined;
    if (header) {
      const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      try {
        return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(header, 'hex'));
      } catch {
        return false;
      }
    }

    // Adyen payload-embedded HMAC
    try {
      const body = JSON.parse(rawBody.toString('utf8'));
      const item = body?.notificationItems?.[0]?.NotificationRequestItem;
      const hmacSignature: string = item?.additionalData?.hmacSignature || '';
      if (!hmacSignature) return false;

      // Build the signing string per Adyen spec
      const fields = [
        item.pspReference,
        item.originalReference || '',
        item.merchantAccountCode,
        item.merchantReference,
        String(item.amount?.value ?? ''),
        item.amount?.currency ?? '',
        item.eventCode,
        item.success,
      ];
      const signingString = fields.join(':');
      const key = Buffer.from(secret, 'hex');
      const expected = crypto.createHmac('sha256', key).update(signingString, 'utf8').digest('base64');
      return expected === hmacSignature;
    } catch {
      return false;
    }
  }

  normalize(payload: Record<string, any>): WebhookEvent | null {
    // Adyen notification format
    const item = payload?.notificationItems?.[0]?.NotificationRequestItem;
    if (!item) return null;

    const externalTransactionId: string = item.pspReference || '';
    if (!externalTransactionId) return null;

    const eventCode: string = item.eventCode || '';
    const success: boolean = item.success === 'true' || item.success === true;

    if (eventCode === 'AUTHORISATION' && success) {
      return { type: 'payment_succeeded', externalTransactionId, gatewayResponse: item };
    }

    if (eventCode === 'AUTHORISATION' && !success) {
      return {
        type: 'payment_failed',
        externalTransactionId,
        errorCode: item.reason || 'authorisation_failed',
        errorMessage: item.reason || 'Authorisation failed',
        gatewayResponse: item,
      };
    }

    if (eventCode === 'CAPTURE' && success) {
      return { type: 'payment_succeeded', externalTransactionId, gatewayResponse: item };
    }

    if (eventCode === 'REFUND' && success) {
      return { type: 'refund_completed', externalTransactionId, gatewayResponse: item };
    }

    return null;
  }
}
