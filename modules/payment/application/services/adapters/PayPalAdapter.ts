/**
 * PayPal Gateway Adapter
 * Implements PSPAdapter — full payment operations + webhook handling.
 * PayPal uses an access-token-based API (OAuth2 client credentials).
 * https://developer.paypal.com/api/rest/
 */

import * as crypto from 'crypto';
import {
  PSPAdapter, PSPCapabilities, PSPConfig, WebhookEvent,
  PaymentRequest, PaymentResponse, CaptureRequest, CaptureResponse,
  VoidRequest, VoidResponse, RefundRequest, RefundResponse, HealthCheckResult,
} from '../GatewayAdapter';

const PAYPAL_CAPABILITIES: PSPCapabilities = {
  supportsAuthCapture: true,
  supportsPartialCapture: true,
  supportsPartialRefund: true,
  supportsVoid: true,
  requiresRedirect: true,
  supportsTokenization: true,
  supportsWebhooks: true,
  supportedCurrencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'BRL', 'MXN'],
  supportedCountries: [],
};

export class PayPalAdapter implements PSPAdapter {
  readonly provider = 'paypal';
  readonly capabilities = PAYPAL_CAPABILITIES;

  private getBaseUrl(config: PSPConfig): string {
    return config.testMode
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
  }

  private async getAccessToken(config: PSPConfig): Promise<string> {
    const res = await fetch(`${this.getBaseUrl(config)}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.apiKey}:${config.webhookSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await res.json() as Record<string, unknown>;
    return (data.access_token as string) || '';
  }

  verifySignature(rawBody: Buffer, headers: Record<string, string | string[] | undefined>, secret: string): boolean {
    const header = (headers['paypal-transmission-sig'] as string | undefined) || '';
    const transmissionId = (headers['paypal-transmission-id'] as string | undefined) || '';
    const timestamp = (headers['paypal-transmission-time'] as string | undefined) || '';
    const certUrl = (headers['paypal-cert-url'] as string | undefined) || '';
    const authAlgo = (headers['paypal-auth-algo'] as string | undefined) || '';

    if (!header || !transmissionId || !timestamp || !certUrl || !authAlgo) return false;

    const verificationString = `${transmissionId}|${timestamp}|${certUrl}|${authAlgo}|${rawBody.toString('utf8')}`;
    const expected = crypto.createHmac('sha256', secret).update(verificationString).digest('base64');

    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(header));
    } catch {
      return false;
    }
  }

  normalize(payload: Record<string, unknown>): WebhookEvent | null {
    const eventType: string = (payload.event_type as string) || '';
    const resource = (payload.resource as Record<string, unknown>) || {};
    const externalTransactionId: string = (resource.id as string) || (resource.parent_payment as string) || '';

    if (!externalTransactionId) return null;

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED' || eventType === 'PAYMENT.AUTHORIZATION.CREATED') {
      return { type: 'payment_succeeded', externalTransactionId, gatewayResponse: payload };
    }

    if (eventType === 'PAYMENT.CAPTURE.DENIED' || eventType === 'PAYMENT.AUTHORIZATION.DENIED') {
      return {
        type: 'payment_failed',
        externalTransactionId,
        errorCode: eventType,
        errorMessage: 'PayPal payment denied',
        gatewayResponse: payload,
      };
    }

    if (eventType === 'PAYMENT.CAPTURE.REFUNDED') {
      return { type: 'refund_completed', externalTransactionId, gatewayResponse: payload };
    }

    return null;
  }

  async initiatePayment(request: PaymentRequest, config: PSPConfig): Promise<PaymentResponse> {
    const token = await this.getAccessToken(config);
    const baseUrl = this.getBaseUrl(config);

    const body = {
      intent: 'AUTHORIZE',
      purchase_units: [{
        reference_id: request.orderId,
        amount: {
          currency_code: request.currency.toUpperCase(),
          value: request.amount.toFixed(2),
        },
        description: request.description,
      }],
      payer: request.customerEmail ? { email_address: request.customerEmail } : undefined,
      application_context: {
        return_url: request.returnUrl || '',
        cancel_url: request.cancelUrl || '',
      },
    };

    const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      const err = (data.error_details as Array<Record<string, unknown>> | undefined)?.[0];
      return {
        success: false,
        externalTransactionId: (data.id as string) || '',
        status: 'failed',
        gatewayResponse: data,
        errorCode: (err?.issue as string) || 'paypal_error',
        errorMessage: (err?.description as string) || 'PayPal API error',
      };
    }

    const status = data.status as string;
    const links = (data.links as Array<Record<string, unknown>>) || [];
    const approveLink = links.find(l => l.rel === 'approve');
    const isAuthorized = status === 'COMPLETED' || status === 'APPROVED';

    return {
      success: true,
      externalTransactionId: (data.id as string) || '',
      status: isAuthorized ? 'authorized' : 'pending',
      redirectUrl: (approveLink?.href as string) || undefined,
      gatewayResponse: data,
    };
  }

  async capturePayment(request: CaptureRequest, config: PSPConfig): Promise<CaptureResponse> {
    const token = await this.getAccessToken(config);
    const baseUrl = this.getBaseUrl(config);

    const res = await fetch(`${baseUrl}/v2/payments/authorizations/${request.externalTransactionId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request.amount ? {
        amount: { value: request.amount.toFixed(2), currency_code: (request.currency || 'USD').toUpperCase() },
      } : {}),
    });

    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      return {
        success: false,
        externalTransactionId: request.externalTransactionId,
        gatewayResponse: data,
        errorCode: (data.name as string) || 'paypal_error',
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
    const token = await this.getAccessToken(config);
    const baseUrl = this.getBaseUrl(config);

    const res = await fetch(`${baseUrl}/v2/payments/authorizations/${request.externalTransactionId}/void`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = res.status === 204 ? {} : await res.json() as Record<string, unknown>;

    if (!res.ok && res.status !== 204) {
      return {
        success: false,
        externalTransactionId: request.externalTransactionId,
        gatewayResponse: data,
        errorCode: (data.name as string) || 'paypal_error',
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
    const token = await this.getAccessToken(config);
    const baseUrl = this.getBaseUrl(config);

    const body = {
      amount: { value: request.amount.toFixed(2), currency_code: request.currency.toUpperCase() },
      note_to_payer: request.reason,
    };

    const res = await fetch(`${baseUrl}/v2/payments/captures/${request.externalTransactionId}/refund`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
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
        errorCode: (data.name as string) || 'paypal_error',
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
      const token = await this.getAccessToken(config);
      return {
        healthy: !!token,
        latencyMs: Date.now() - start,
        message: token ? undefined : 'Failed to obtain PayPal access token',
      };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : 'PayPal health check failed',
      };
    }
  }
}
