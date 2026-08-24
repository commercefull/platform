/**
 * Klarna Gateway Adapter
 * Implements PSPAdapter — Klarna Payments API.
 * https://docs.klarna.com/api/
 */

import * as crypto from 'crypto';
import {
  PSPAdapter, PSPCapabilities, PSPConfig, WebhookEvent,
  PaymentRequest, PaymentResponse, CaptureRequest, CaptureResponse,
  VoidRequest, VoidResponse, RefundRequest, RefundResponse, HealthCheckResult,
} from '../GatewayAdapter';

const KLARNA_CAPABILITIES: PSPCapabilities = {
  supportsAuthCapture: true,
  supportsPartialCapture: true,
  supportsPartialRefund: true,
  supportsVoid: true,
  requiresRedirect: true,
  supportsTokenization: false,
  supportsWebhooks: true,
  supportedCurrencies: ['USD', 'EUR', 'GBP', 'SEK', 'NOK', 'DKK', 'AUD', 'CAD'],
  supportedCountries: ['US', 'GB', 'SE', 'NO', 'DK', 'DE', 'AT', 'NL', 'AU', 'CA'],
  minAmount: 0,
  maxAmount: 100000,
};

export class KlarnaAdapter implements PSPAdapter {
  readonly provider = 'klarna';
  readonly capabilities = KLARNA_CAPABILITIES;

  private getBaseUrl(config: PSPConfig): string {
    const region = (config.extra?.region as string) || 'eu';
    if (config.testMode) {
      return region === 'us' ? 'https://api-na.playground.klarna.com' : 'https://api.playground.klarna.com';
    }
    return region === 'us' ? 'https://api-na.klarna.com' : 'https://api.klarna.com';
  }

  private getAuthHeader(config: PSPConfig): string {
    return `Basic ${Buffer.from(`${config.apiKey}:${config.webhookSecret}`).toString('base64')}`;
  }

  verifySignature(rawBody: Buffer, headers: Record<string, string | string[] | undefined>, secret: string): boolean {
    const header = (headers['klarna-signature'] as string | undefined) || '';
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
    const orderId: string = (payload.order_id as string) || '';

    if (!orderId) return null;

    if (eventType === 'FRAUD_RISK_ACCEPTED' || eventType === 'PAYMENT_REMINDER') {
      return { type: 'payment_succeeded', externalTransactionId: orderId, gatewayResponse: payload };
    }

    if (eventType === 'FRAUD_RISK_REJECTED' || eventType === 'FRAUD_RISK_STOPPED') {
      return {
        type: 'payment_failed',
        externalTransactionId: orderId,
        errorCode: eventType,
        errorMessage: 'Klarna fraud risk rejected',
        gatewayResponse: payload,
      };
    }

    return null;
  }

  async initiatePayment(request: PaymentRequest, config: PSPConfig): Promise<PaymentResponse> {
    const baseUrl = this.getBaseUrl(config);

    const body = {
      purchase_country: ((config.extra?.country as string) || 'US').toUpperCase(),
      purchase_currency: request.currency.toUpperCase(),
      locale: (config.extra?.locale as string) || 'en-US',
      order_amount: Math.round(request.amount * 100),
      order_lines: [{
        type: 'physical',
        reference: request.orderId,
        name: request.description || `Order ${request.orderId}`,
        quantity: 1,
        total_amount: Math.round(request.amount * 100),
        unit_price: Math.round(request.amount * 100),
      }],
      merchant_urls: {
        confirmation: request.returnUrl || '',
        push: '',
      },
    };

    const res = await fetch(`${baseUrl}/payments/v1/sessions`, {
      method: 'POST',
      headers: {
        Authorization: this.getAuthHeader(config),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      const err = (data.error_messages as Array<string> | undefined)?.[0];
      return {
        success: false,
        externalTransactionId: (data.session_id as string) || '',
        status: 'failed',
        gatewayResponse: data,
        errorCode: 'klarna_error',
        errorMessage: err || 'Klarna API error',
      };
    }

    return {
      success: true,
      externalTransactionId: (data.session_id as string) || '',
      status: 'pending',
      redirectUrl: (data.client_token as string) ? `${this.getBaseUrl(config)}/payments/v1/authorizations` : undefined,
      gatewayResponse: data,
    };
  }

  async capturePayment(request: CaptureRequest, config: PSPConfig): Promise<CaptureResponse> {
    const baseUrl = this.getBaseUrl(config);

    const body = request.amount ? { captured_amount: Math.round(request.amount * 100) } : {};

    const res = await fetch(`${baseUrl}/ordermanagement/v1/orders/${request.externalTransactionId}/captures`, {
      method: 'POST',
      headers: {
        Authorization: this.getAuthHeader(config),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = res.status === 201 ? {} : await res.json() as Record<string, unknown>;

    if (!res.ok && res.status !== 201) {
      return {
        success: false,
        externalTransactionId: request.externalTransactionId,
        gatewayResponse: data,
        errorCode: 'klarna_capture_error',
        errorMessage: (data.error_messages as Array<string> | undefined)?.[0] || 'Capture failed',
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

    const res = await fetch(`${baseUrl}/ordermanagement/v1/orders/${request.externalTransactionId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: this.getAuthHeader(config),
        'Content-Type': 'application/json',
      },
    });

    const data = res.status === 204 ? {} : await res.json() as Record<string, unknown>;

    if (!res.ok && res.status !== 204) {
      return {
        success: false,
        externalTransactionId: request.externalTransactionId,
        gatewayResponse: data,
        errorCode: 'klarna_void_error',
        errorMessage: (data.error_messages as Array<string> | undefined)?.[0] || 'Void failed',
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
      refunded_amount: Math.round(request.amount * 100),
      description: request.reason,
    };

    const res = await fetch(`${baseUrl}/ordermanagement/v1/orders/${request.externalTransactionId}/refunds`, {
      method: 'POST',
      headers: {
        Authorization: this.getAuthHeader(config),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = res.status === 201 ? {} : await res.json() as Record<string, unknown>;

    if (!res.ok && res.status !== 201) {
      return {
        success: false,
        externalRefundId: '',
        gatewayResponse: data,
        errorCode: 'klarna_refund_error',
        errorMessage: (data.error_messages as Array<string> | undefined)?.[0] || 'Refund failed',
      };
    }

    return {
      success: true,
      externalRefundId: request.externalTransactionId,
      gatewayResponse: data,
    };
  }

  async checkHealth(config: PSPConfig): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.getBaseUrl(config)}/payments/v1/sessions`, {
        method: 'POST',
        headers: {
          Authorization: this.getAuthHeader(config),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_amount: 1, purchase_currency: 'USD' }),
      });
      return {
        healthy: res.status === 200 || res.status === 400,
        latencyMs: Date.now() - start,
        message: res.ok ? undefined : `Klarna API returned ${res.status}`,
      };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : 'Klarna health check failed',
      };
    }
  }
}
