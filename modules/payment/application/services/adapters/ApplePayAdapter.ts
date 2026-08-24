/**
 * Apple Pay Gateway Adapter
 * Implements PSPAdapter — Apple Pay via Stripe as payment processor.
 * Apple Pay itself doesn't have a direct API for server-side payment processing;
 * it provides a payment token that is processed through a PSP (Stripe, Adyen, etc.).
 * This adapter wraps the Stripe-based Apple Pay flow.
 *
 * https://developer.apple.com/documentation/apple_pay_on_the_web
 */

import * as crypto from 'crypto';
import {
  PSPAdapter, PSPCapabilities, PSPConfig, WebhookEvent,
  PaymentRequest, PaymentResponse, CaptureRequest, CaptureResponse,
  VoidRequest, VoidResponse, RefundRequest, RefundResponse, HealthCheckResult,
} from '../GatewayAdapter';

const APPLE_PAY_CAPABILITIES: PSPCapabilities = {
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

export class ApplePayAdapter implements PSPAdapter {
  readonly provider = 'apple_pay';
  readonly capabilities = APPLE_PAY_CAPABILITIES;

  verifySignature(rawBody: Buffer, headers: Record<string, string | string[] | undefined>, secret: string): boolean {
    // Apple Pay notifications come through the underlying PSP (Stripe/Adyen)
    // so signature verification is handled by the primary adapter.
    // For direct Apple Pay merchant notifications, verify via Apple's merchant identity certificate.
    const header = (headers['x-apple-pay-signature'] as string | undefined) || '';
    if (!header) return false;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(header, 'hex'));
    } catch {
      return false;
    }
  }

  normalize(payload: Record<string, unknown>): WebhookEvent | null {
    // Apple Pay notifications typically come through the PSP's webhook system.
    // This handles direct Apple Pay merchant notifications if configured.
    const notificationType: string = (payload.notificationType as string) || '';
    const payment = (payload.payment as Record<string, unknown>) || {};
    const externalTransactionId: string = (payment.externalTransactionId as string) || '';

    if (!externalTransactionId) return null;

    if (notificationType === 'PAYMENT_SUCCESS') {
      return { type: 'payment_succeeded', externalTransactionId, gatewayResponse: payload };
    }

    if (notificationType === 'PAYMENT_FAILURE') {
      return {
        type: 'payment_failed',
        externalTransactionId,
        errorCode: 'apple_pay_failure',
        errorMessage: 'Apple Pay payment failed',
        gatewayResponse: payload,
      };
    }

    if (notificationType === 'REFUND_SUCCESS') {
      return { type: 'refund_completed', externalTransactionId, gatewayResponse: payload };
    }

    return null;
  }

  async initiatePayment(request: PaymentRequest, config: PSPConfig): Promise<PaymentResponse> {
    // Apple Pay tokens are processed through the configured PSP (Stripe by default).
    // The paymentMethodToken contains the Apple Pay payment data.
    const baseUrl = config.testMode ? 'https://api.stripe.com/v1' : 'https://api.stripe.com/v1';

    if (!request.paymentMethodToken) {
      return {
        success: false,
        externalTransactionId: '',
        status: 'failed',
        gatewayResponse: {},
        errorCode: 'missing_apple_pay_token',
        errorMessage: 'Apple Pay payment method token is required',
      };
    }

    const body = new URLSearchParams({
      amount: String(Math.round(request.amount * 100)),
      currency: request.currency.toLowerCase(),
      'metadata[orderId]': request.orderId,
      payment_method: request.paymentMethodToken,
      confirm: 'true',
      automatic_payment_methods: 'enabled',
    });

    if (request.customerEmail) body.append('receipt_email', request.customerEmail);

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
        errorCode: (err?.code as string) || 'apple_pay_error',
        errorMessage: (err?.message as string) || 'Apple Pay payment failed',
      };
    }

    const status = data.status as string;
    const isCaptured = status === 'succeeded';

    return {
      success: true,
      externalTransactionId: (data.id as string) || '',
      status: isCaptured ? 'captured' : 'authorized',
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
        errorCode: (err?.code as string) || 'apple_pay_capture_error',
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
        errorCode: (err?.code as string) || 'apple_pay_void_error',
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
        errorCode: (err?.code as string) || 'apple_pay_refund_error',
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
    // Apple Pay health is dependent on the underlying PSP (Stripe)
    const start = Date.now();
    try {
      const res = await fetch('https://api.stripe.com/v1/balance', {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });
      return {
        healthy: res.ok,
        latencyMs: Date.now() - start,
        message: res.ok ? undefined : `Stripe (Apple Pay) API returned ${res.status}`,
      };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : 'Apple Pay health check failed',
      };
    }
  }
}
