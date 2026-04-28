/**
 * Generic / Fallback Gateway Adapter
 * Used when the provider is unknown or for custom integrations.
 * Expects a simple normalized payload shape.
 */

import * as crypto from 'crypto';
import { GatewayAdapter, WebhookEvent } from '../GatewayAdapter';

export class GenericAdapter implements GatewayAdapter {
  readonly provider = 'generic';

  verifySignature(rawBody: Buffer, headers: Record<string, string | string[] | undefined>, secret: string): boolean {
    const header = (headers['x-webhook-signature'] as string | undefined) || '';
    if (!header) return false;
    const provided = header.startsWith('sha256=') ? header.slice(7) : header;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
    } catch {
      return false;
    }
  }

  normalize(payload: Record<string, any>): WebhookEvent | null {
    // Accepts a pre-normalized shape: { type, externalTransactionId, errorCode?, errorMessage? }
    const type: string = payload.type || payload.eventType || '';
    const externalTransactionId: string = payload.externalTransactionId || payload.data?.object?.id || '';
    if (!externalTransactionId) return null;

    if (type === 'payment_intent.succeeded' || type === 'payment_succeeded') {
      return { type: 'payment_succeeded', externalTransactionId, gatewayResponse: payload };
    }
    if (type === 'payment_intent.payment_failed' || type === 'payment_failed') {
      return {
        type: 'payment_failed',
        externalTransactionId,
        errorCode: payload.errorCode || 'payment_failed',
        errorMessage: payload.errorMessage || 'Payment failed',
        gatewayResponse: payload,
      };
    }
    return null;
  }
}
