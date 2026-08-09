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
      const body = JSON.parse(rawBody.toString('utf8')) as Record<string, unknown>;
      const notificationItems = body?.notificationItems as Array<Record<string, unknown>> | undefined;
      const firstItem = notificationItems?.[0] as Record<string, unknown> | undefined;
      const item = firstItem?.NotificationRequestItem as Record<string, unknown> | undefined;
      if (!item) return false;

      const additionalData = item.additionalData as Record<string, unknown> | undefined;
      const hmacSignature: string = (additionalData?.hmacSignature as string) || '';
      if (!hmacSignature) return false;

      // Build the signing string per Adyen spec
      const amount = item.amount as Record<string, unknown> | undefined;
      const fields = [
        item.pspReference as string,
        (item.originalReference as string) || '',
        item.merchantAccountCode as string,
        item.merchantReference as string,
        String(amount?.value ?? ''),
        (amount?.currency as string) ?? '',
        item.eventCode as string,
        item.success as string,
      ];
      const signingString = fields.join(':');
      const key = Buffer.from(secret, 'hex');
      const expected = crypto.createHmac('sha256', key).update(signingString, 'utf8').digest('base64');
      return expected === hmacSignature;
    } catch {
      return false;
    }
  }

  normalize(payload: Record<string, unknown>): WebhookEvent | null {
    // Adyen notification format
    const notificationItems = payload?.notificationItems as Array<Record<string, unknown>> | undefined;
    const firstItem = notificationItems?.[0] as Record<string, unknown> | undefined;
    const item = firstItem?.NotificationRequestItem as Record<string, unknown> | undefined;
    if (!item) return null;

    const externalTransactionId: string = (item.pspReference as string) || '';
    if (!externalTransactionId) return null;

    const eventCode: string = (item.eventCode as string) || '';
    const success: boolean = item.success === 'true' || item.success === true;

    if (eventCode === 'AUTHORISATION' && success) {
      return { type: 'payment_succeeded', externalTransactionId, gatewayResponse: item };
    }

    if (eventCode === 'AUTHORISATION' && !success) {
      return {
        type: 'payment_failed',
        externalTransactionId,
        errorCode: (item.reason as string) || 'authorisation_failed',
        errorMessage: (item.reason as string) || 'Authorisation failed',
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
