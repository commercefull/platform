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

  normalize(payload: Record<string, unknown>): WebhookEvent | null {
    // Accepts a pre-normalized shape: { type, externalTransactionId, errorCode?, errorMessage? }
    const type: string = (payload.type as string) || (payload.eventType as string) || '';
    const dataObj = payload.data as Record<string, unknown> | undefined;
    const nestedObj = dataObj?.object as Record<string, unknown> | undefined;
    const externalTransactionId: string = (payload.externalTransactionId as string) || (nestedObj?.id as string) || '';
    if (!externalTransactionId) return null;

    if (type === 'payment_intent.succeeded' || type === 'payment_succeeded') {
      return { type: 'payment_succeeded', externalTransactionId, gatewayResponse: payload };
    }
    if (type === 'payment_intent.payment_failed' || type === 'payment_failed') {
      return {
        type: 'payment_failed',
        externalTransactionId,
        errorCode: (payload.errorCode as string) || 'payment_failed',
        errorMessage: (payload.errorMessage as string) || 'Payment failed',
        gatewayResponse: payload,
      };
    }
    return null;
  }
}
