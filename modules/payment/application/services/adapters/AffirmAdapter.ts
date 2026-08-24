/**
 * Affirm Gateway Adapter
 * Implements PSPAdapter — Affirm Buy-Now-Pay-Later API.
 * https://docs.affirm.com/
 */

import * as crypto from 'crypto';
import {
  PSPAdapter, PSPCapabilities, PSPConfig, WebhookEvent,
  PaymentRequest, PaymentResponse, CaptureRequest, CaptureResponse,
  VoidRequest, VoidResponse, RefundRequest, RefundResponse, HealthCheckResult,
} from '../GatewayAdapter';

const AFFIRM_CAPABILITIES: PSPCapabilities = {
  supportsAuthCapture: true,
  supportsPartialCapture: false,
  supportsPartialRefund: true,
  supportsVoid: true,
  requiresRedirect: true,
  supportsTokenization: false,
  supportsWebhooks: true,
  supportedCurrencies: ['USD', 'CAD'],
  supportedCountries: ['US', 'CA'],
  minAmount: 50,
  maxAmount: 30000,
};

export class AffirmAdapter implements PSPAdapter {
  readonly provider = 'affirm';
  readonly capabilities = AFFIRM_CAPABILITIES;

  private getBaseUrl(config: PSPConfig): string {
    return config.testMode
      ? 'https://sandbox.affirm.com/api/v1'
      : 'https://api.affirm.com/api/v1';
  }

  private getAuthHeader(config: PSPConfig): string {
    return `Basic ${Buffer.from(`${config.apiKey}:${config.webhookSecret}`).toString('base64')}`;
  }

  verifySignature(rawBody: Buffer, headers: Record<string, string | string[] | undefined>, secret: string): boolean {
    const header = (headers['x-affirm-signature'] as string | undefined) || '';
    if (!header) return false;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(header));
    } catch {
      return false;
    }
  }

  normalize(payload: Record<string, unknown>): WebhookEvent | null {
    const eventType: string = (payload.event_type as string) || '';
    const transactionId: string = (payload.transaction_id as string) || (payload.checkout_id as string) || '';

    if (!transactionId) return null;

    if (eventType === 'charge.confirmed') {
      return { type: 'payment_succeeded', externalTransactionId: transactionId, gatewayResponse: payload };
    }

    if (eventType === 'charge.failed' || eventType === 'checkout.declined') {
      return {
        type: 'payment_failed',
        externalTransactionId: transactionId,
        errorCode: eventType,
        errorMessage: 'Affirm charge failed',
        gatewayResponse: payload,
      };
    }

    if (eventType === 'refund.created') {
      return { type: 'refund_completed', externalTransactionId: transactionId, gatewayResponse: payload };
    }

    return null;
  }

  async initiatePayment(request: PaymentRequest, config: PSPConfig): Promise<PaymentResponse> {
    const baseUrl = this.getBaseUrl(config);

    const body = {
      merchant_internal_reference_id: request.orderId,
      amount: Math.round(request.amount * 100),
      currency: request.currency.toUpperCase(),
      items: [{
        display_name: request.description || `Order ${request.orderId}`,
        sku: request.orderId,
        unit_price: Math.round(request.amount * 100),
        qty: 1,
        item_image_url: '',
        item_url: '',
      }],
      merchant: {
        public_api_key: config.publishableKey || config.apiKey,
        user_confirmation_url: request.returnUrl || '',
        user_cancel_url: request.cancelUrl || '',
        user_confirmation_url_action: 'GET',
      },
    };

    const res = await fetch(`${baseUrl}/checkout`, {
      method: 'POST',
      headers: {
        Authorization: this.getAuthHeader(config),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      return {
        success: false,
        externalTransactionId: (data.checkout_id as string) || '',
        status: 'failed',
        gatewayResponse: data,
        errorCode: 'affirm_error',
        errorMessage: (data.message as string) || 'Affirm API error',
      };
    }

    return {
      success: true,
      externalTransactionId: (data.checkout_id as string) || '',
      status: 'pending',
      redirectUrl: (data.redirect_url as string) || undefined,
      gatewayResponse: data,
    };
  }

  async capturePayment(request: CaptureRequest, config: PSPConfig): Promise<CaptureResponse> {
    const baseUrl = this.getBaseUrl(config);

    const res = await fetch(`${baseUrl}/charges/${request.externalTransactionId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: this.getAuthHeader(config),
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      return {
        success: false,
        externalTransactionId: request.externalTransactionId,
        gatewayResponse: data,
        errorCode: 'affirm_capture_error',
        errorMessage: (data.message as string) || 'Capture failed',
      };
    }

    return {
      success: true,
      externalTransactionId: request.externalTransactionId,
      gatewayResponse: data,
    };
  }

  async voidPayment(request: VoidRequest, config: PSPConfig): Promise<VoidResponse> {
    const baseUrl = this.getBaseUrl(config);

    const res = await fetch(`${baseUrl}/charges/${request.externalTransactionId}/void`, {
      method: 'POST',
      headers: {
        Authorization: this.getAuthHeader(config),
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      return {
        success: false,
        externalTransactionId: request.externalTransactionId,
        gatewayResponse: data,
        errorCode: 'affirm_void_error',
        errorMessage: (data.message as string) || 'Void failed',
      };
    }

    return {
      success: true,
      externalTransactionId: request.externalTransactionId,
      gatewayResponse: data,
    };
  }

  async refundPayment(request: RefundRequest, config: PSPConfig): Promise<RefundResponse> {
    const baseUrl = this.getBaseUrl(config);

    const body = {
      amount: Math.round(request.amount * 100),
      reference_id: request.reason || 'refund',
    };

    const res = await fetch(`${baseUrl}/charges/${request.externalTransactionId}/refund`, {
      method: 'POST',
      headers: {
        Authorization: this.getAuthHeader(config),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      return {
        success: false,
        externalRefundId: '',
        gatewayResponse: data,
        errorCode: 'affirm_refund_error',
        errorMessage: (data.message as string) || 'Refund failed',
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
      const res = await fetch(`${this.getBaseUrl(config)}/checkout`, {
        method: 'POST',
        headers: {
          Authorization: this.getAuthHeader(config),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: 100, currency: 'USD' }),
      });
      return {
        healthy: res.status === 200 || res.status === 400 || res.status === 422,
        latencyMs: Date.now() - start,
        message: res.ok ? undefined : `Affirm API returned ${res.status}`,
      };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : 'Affirm health check failed',
      };
    }
  }
}
