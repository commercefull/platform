/**
 * Gateway Adapter Interface
 *
 * Each payment provider (Stripe, Adyen, PayPal, …) implements this interface.
 * The webhook controller uses it to:
 *   1. Verify the inbound signature without knowing the provider.
 *   2. Normalize the raw payload into a canonical WebhookEvent.
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
  gatewayResponse: Record<string, any>;
}

// ============================================================================
// Adapter interface
// ============================================================================

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
  normalize(payload: Record<string, any>): WebhookEvent | null;
}
