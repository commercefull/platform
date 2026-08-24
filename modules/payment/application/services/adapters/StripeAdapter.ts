/**
 * Stripe Gateway Adapter
 * Implements PSPAdapter — full payment operations + webhook handling.
 */

import * as crypto from 'crypto';
import {
  PSPAdapter, PSPCapabilities, PSPConfig, WebhookEvent,
  PaymentRequest, PaymentResponse, CaptureRequest, CaptureResponse,
  VoidRequest, VoidResponse, RefundRequest, RefundResponse, HealthCheckResult,
} from '../GatewayAdapter';

const STRIPE_CAPABILITIES: PSPCapabilities = {
  supportsAuthCapture: true,
  supportsPartialCapture: true,
  supportsPartialRefund: true,
  supportsVoid: true,
  requiresRedirect: false,
  supportsTokenization: true,
  supportsWebhooks: true,
  supportedCurrencies: [],
  supportedCountries: [],
};

export class StripeAdapter implements PSPAdapter {
  readonly provider = 'stripe';
  readonly capabilities = STRIPE_CAPABILITIES;

  verifySignature(rawBody: Buffer, headers: Record<string, string | string[] | undefined>, secret: string): boolean {
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

    if (eventType === 'charge.refunded') {
      return { type: 'refund_completed', externalTransactionId, gatewayResponse: obj };
    }

    return null;
  }

  async initiatePayment(request: PaymentRequest, config: PSPConfig): Promise<PaymentResponse> {
    const baseUrl = config.testMode ? 'https://api.stripe.com/v1' : 'https://api.stripe.com/v1';
    const body = new URLSearchParams({
      amount: String(Math.round(request.amount * 100)),
      currency: request.currency.toLowerCase(),
      'metadata[orderId]': request.orderId,
      automatic_payment_methods: 'enabled',
    });

    if (request.customerEmail) body.append('receipt_email', request.customerEmail);
    if (request.description) body.append('description', request.description);
    if (request.returnUrl) {
      body.append('confirmation_method', 'manual');
    }

    const res = await fetch(`${baseUrl}/payment_intents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      const err = data.error as Record<string, unknown> | undefined;
      return {
        success: false,
        externalTransactionId: (data.id as string) || '',
        status: 'failed',
        gatewayResponse: data,
        errorCode: (err?.code as string) || 'stripe_error',
        errorMessage: (err?.message as string) || 'Stripe API error',
      };
    }

    const status = data.status as string;
    const isAuthorized = status === 'requires_capture' || status === 'succeeded';
    const isCaptured = status === 'succeeded';

    return {
      success: true,
      externalTransactionId: (data.id as string) || '',
      status: isCaptured ? 'captured' : isAuthorized ? 'authorized' : 'pending',
      redirectUrl: (data.next_action as Record<string, unknown>)?.url as string | undefined,
      gatewayResponse: data,
    };
  }

  async capturePayment(request: CaptureRequest, config: PSPConfig): Promise<CaptureResponse> {
    const baseUrl = config.testMode ? 'https://api.stripe.com/v1' : 'https://api.stripe.com/v1';
    const body = new URLSearchParams();
    if (request.amount) body.append('amount_to_capture', String(Math.round(request.amount * 100)));

    const res = await fetch(`${baseUrl}/payment_intents/${request.externalTransactionId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      const err = data.error as Record<string, unknown> | undefined;
      return {
        success: false,
        externalTransactionId: request.externalTransactionId,
        gatewayResponse: data,
        errorCode: (err?.code as string) || 'stripe_error',
        errorMessage: (err?.message as string) || 'Capture failed',
      };
    }

    return {
      success: true,
      externalTransactionId: request.externalTransactionId,
      gatewayResponse: data,
    };
  }

  async voidPayment(request: VoidRequest, config: PSPConfig): Promise<VoidResponse> {
    const baseUrl = config.testMode ? 'https://api.stripe.com/v1' : 'https://api.stripe.com/v1';
    const body = new URLSearchParams({ cancellation_reason: request.reason || 'requested_by_customer' });

    const res = await fetch(`${baseUrl}/payment_intents/${request.externalTransactionId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      const err = data.error as Record<string, unknown> | undefined;
      return {
        success: false,
        externalTransactionId: request.externalTransactionId,
        gatewayResponse: data,
        errorCode: (err?.code as string) || 'stripe_error',
        errorMessage: (err?.message as string) || 'Void failed',
      };
    }

    return {
      success: true,
      externalTransactionId: request.externalTransactionId,
      gatewayResponse: data,
    };
  }

  async refundPayment(request: RefundRequest, config: PSPConfig): Promise<RefundResponse> {
    const baseUrl = config.testMode ? 'https://api.stripe.com/v1' : 'https://api.stripe.com/v1';
    const body = new URLSearchParams({
      payment_intent: request.externalTransactionId,
      amount: String(Math.round(request.amount * 100)),
    });
    if (request.reason) body.append('reason', request.reason);

    const res = await fetch(`${baseUrl}/refunds`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      const err = data.error as Record<string, unknown> | undefined;
      return {
        success: false,
        externalRefundId: '',
        gatewayResponse: data,
        errorCode: (err?.code as string) || 'stripe_error',
        errorMessage: (err?.message as string) || 'Refund failed',
      };
    }

    return {
      success: true,
      externalRefundId: (data.id as string) || '',
      gatewayResponse: data,
    };
  }

  async checkHealth(config: PSPConfig): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const res = await fetch('https://api.stripe.com/v1/balance', {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });
      return {
        healthy: res.ok,
        latencyMs: Date.now() - start,
        message: res.ok ? undefined : `Stripe API returned ${res.status}`,
      };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : 'Stripe health check failed',
      };
    }
  }
}
