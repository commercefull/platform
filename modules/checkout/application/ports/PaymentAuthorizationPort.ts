/**
 * PaymentAuthorizationPort
 *
 * ACL port owned by checkout. Initiates and manages payment intents
 * through checkout's vocabulary — no payment domain types leak.
 */

export interface PaymentAuthorizationRequest {
  orderId: string;
  amountCents: number;
  currency: string;
  paymentMethodId: string;
  customerId?: string;
  /**
   * Delegated/tokenized credential supplied by an external surface
   * (e.g. ACP `payment_data.instrument.credential`, Stripe SPT).
   * Opaque to checkout — forwarded to the payment module.
   */
  delegatedCredential?: {
    provider: string;
    credentialType: string;
    token: string;
  };
}

export interface PaymentAuthorizationResult {
  transactionId: string;
  status: string;
}

export interface PaymentAuthorizationPort {
  initiatePayment(request: PaymentAuthorizationRequest): Promise<PaymentAuthorizationResult>;
}
