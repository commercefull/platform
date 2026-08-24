/**
 * Gateway Adapter Interface
 *
 * Each payment provider (Stripe, Adyen, PayPal, …) implements this interface.
 * The webhook controller uses it to:
 *   1. Verify the inbound signature without knowing the provider.
 *   2. Normalize the raw payload into a canonical WebhookEvent.
 *
 * The PSPAdapter interface extends this with full payment operations
 * (initiate, capture, void, refund) for the failover routing engine.
 */

// ============================================================================
// Canonical event — provider-agnostic
// ============================================================================

export type WebhookEventType = 'payment_succeeded' | 'payment_failed' | 'refund_completed' | 'unknown';

export interface WebhookEvent {
  /** Normalized event type understood by the core handler */
  type: WebhookEventType;
  /** The gateway's own payment-intent / transaction id */
  externalTransactionId: string;
  /** Error code when type === 'payment_failed' */
  errorCode?: string;
  /** Human-readable failure reason */
  errorMessage?: string;
  /** Full raw gateway object for audit storage */
  gatewayResponse: Record<string, unknown>;
}

// ============================================================================
// Canonical payment request / response — provider-agnostic
// ============================================================================

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  customerId?: string;
  customerEmail?: string;
  customerIp?: string;
  paymentMethodToken?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  /** Return URL for redirect-based flows (PayPal, Klarna, Affirm) */
  returnUrl?: string;
  /** Cancel URL for redirect-based flows */
  cancelUrl?: string;
}

export interface PaymentResponse {
  success: boolean;
  externalTransactionId: string;
  status: 'authorized' | 'captured' | 'pending' | 'failed';
  /** For redirect-based providers, this is the URL the customer must visit */
  redirectUrl?: string;
  /** Provider-specific response data for audit storage */
  gatewayResponse: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
}

export interface CaptureRequest {
  externalTransactionId: string;
  amount?: number;
  currency?: string;
}

export interface CaptureResponse {
  success: boolean;
  externalTransactionId: string;
  gatewayResponse: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
}

export interface VoidRequest {
  externalTransactionId: string;
  reason?: string;
}

export interface VoidResponse {
  success: boolean;
  externalTransactionId: string;
  gatewayResponse: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
}

export interface RefundRequest {
  externalTransactionId: string;
  amount: number;
  currency: string;
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  externalRefundId: string;
  gatewayResponse: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
}

// ============================================================================
// Health check
// ============================================================================

export interface HealthCheckResult {
  healthy: boolean;
  latencyMs?: number;
  message?: string;
}

// ============================================================================
// Adapter interfaces
// ============================================================================

/**
 * Base adapter interface — webhook-only adapters (e.g. GenericAdapter) implement this.
 */
export interface GatewayAdapter {
  /** Provider slug stored in the paymentGateway table (e.g. 'stripe', 'adyen') */
  readonly provider: string;

  /**
   * Verify the inbound webhook signature.
   * @param rawBody  Raw request body bytes (before JSON.parse)
   * @param headers  All request headers (lowercased)
   * @param secret   The webhook secret for this gateway config
   */
  verifySignature(rawBody: Buffer, headers: Record<string, string | string[] | undefined>, secret: string): boolean;

  /**
   * Normalize the raw payload into a canonical WebhookEvent.
   * Return `null` for event types the adapter does not handle (they will be silently acked).
   */
  normalize(payload: Record<string, unknown>): WebhookEvent | null;
}

/**
 * Full PSP adapter interface — providers that can initiate/capture/void/refund payments.
 */
export interface PSPAdapter extends GatewayAdapter {
  /** Capabilities supported by this provider */
  readonly capabilities: PSPCapabilities;

  /**
   * Initiate a payment (authorize or charge depending on captureMode).
   */
  initiatePayment(request: PaymentRequest, config: PSPConfig): Promise<PaymentResponse>;

  /**
   * Capture a previously authorized payment.
   */
  capturePayment(request: CaptureRequest, config: PSPConfig): Promise<CaptureResponse>;

  /**
   * Void / cancel a pending or authorized payment.
   */
  voidPayment(request: VoidRequest, config: PSPConfig): Promise<VoidResponse>;

  /**
   * Refund a captured payment.
   */
  refundPayment(request: RefundRequest, config: PSPConfig): Promise<RefundResponse>;

  /**
   * Check provider health / availability.
   */
  checkHealth(config: PSPConfig): Promise<HealthCheckResult>;
}

// ============================================================================
// Provider capabilities & config
// ============================================================================

export interface PSPCapabilities {
  /** Supports authorize-then-capture flow (manual capture) */
  supportsAuthCapture: boolean;
  /** Supports partial captures */
  supportsPartialCapture: boolean;
  /** Supports partial refunds */
  supportsPartialRefund: boolean;
  /** Supports voiding authorized payments */
  supportsVoid: boolean;
  /** Requires customer redirect (PayPal, Klarna, Affirm) */
  requiresRedirect: boolean;
  /** Supports stored payment methods / tokenization */
  supportsTokenization: boolean;
  /** Supports webhooks */
  supportsWebhooks: boolean;
  /** Supported currencies (empty = all) */
  supportedCurrencies: string[];
  /** Supported countries (empty = all) */
  supportedCountries: string[];
  /** Minimum transaction amount */
  minAmount?: number;
  /** Maximum transaction amount */
  maxAmount?: number;
}

export interface PSPConfig {
  /** API key or secret key */
  apiKey: string;
  /** Publishable key (client-side) */
  publishableKey?: string;
  /** Webhook secret for signature verification */
  webhookSecret: string;
  /** Whether to use test/sandbox mode */
  testMode: boolean;
  /** Merchant account reference at the provider */
  merchantAccount?: string;
  /** Additional provider-specific config */
  extra?: Record<string, unknown>;
}
