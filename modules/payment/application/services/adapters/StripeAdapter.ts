/**
 * Stripe Gateway Adapter
 */

import * as crypto from 'crypto';
import { GatewayAdapter, WebhookEvent } from '../GatewayAdapter';

export class StripeAdapter implements GatewayAdapter {
  readonly provider = 'stripe';

  verifySignature(rawBody: Buffer, headers: Record<string, string | string[] | undefined>, secret: string): boolean {
    // Stripe sends: Stripe-Signature: t=<ts>,v1=<sig>
    const header = headers['stripe-signature'] as string | undefined;
    if (!header) return false;

    const parts: Record<string, string> = {};
    for (const part of header.split(',')) {
      const [k, v] = part.split('=');
      if (k && v) parts[k.trim()] = v.trim();
    }

    const timestamp = parts['t'];
    const v1 = parts['v1'];
    if (!timestamp || !v1) return false;

    const signed = `${timestamp}.${rawBody.toString('utf8')}`;
    const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(v1, 'hex'));
    } catch {
      return false;
    }
  }

  normalize(payload: Record<string, unknown>): WebhookEvent | null {
    const eventType: string = (payload.type as string) || '';
    const dataObj = payload.data as Record<string, unknown> | undefined;
    const obj = (dataObj?.object as Record<string, unknown>) || {};
    const externalTransactionId: string = (obj.id as string) || '';

    if (!externalTransactionId) return null;

    if (eventType === 'payment_intent.succeeded') {
      return { type: 'payment_succeeded', externalTransactionId, gatewayResponse: obj };
    }

    if (eventType === 'payment_intent.payment_failed') {
      const err = (obj.last_payment_error as Record<string, unknown>) || {};
      return {
        type: 'payment_failed',
        externalTransactionId,
        errorCode: (err.code as string) || 'payment_failed',
        errorMessage: (err.message as string) || 'Payment failed',
        gatewayResponse: obj,
      };
    }

    return null; // unhandled event type
  }
}
