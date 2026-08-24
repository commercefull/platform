/**
 * PaymentAuthorizationPort
 *
 * ACL port owned by checkout. Initiates and manages payment intents
 * through checkout's vocabulary — no payment domain types leak.
 */

export interface PaymentAuthorizationRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  customerId?: string;
}

export interface PaymentAuthorizationResult {
  transactionId: string;
  status: string;
}

export interface PaymentAuthorizationPort {
  initiatePayment(request: PaymentAuthorizationRequest): Promise<PaymentAuthorizationResult>;
}
