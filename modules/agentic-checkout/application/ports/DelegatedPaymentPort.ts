/**
 * DelegatedPaymentPort
 *
 * ACL port owned by agentic-checkout. Charges a surface-issued delegated
 * credential (e.g. a Stripe Shared Payment Token) against the routed PSP —
 * the synchronous server-side equivalent of the storefront's client-confirm +
 * PSP-webhook path. Raw card data never enters Commercefull: the token is
 * opaque and PSP-scoped.
 */

import type { DelegatedCredential } from './ChannelCheckoutPort';

export interface DelegatedChargeRequest {
  organizationId: string;
  orderId: string;
  /** Internal payment transaction id (checkout's paymentIntentId) */
  transactionId: string;
  amountCents: number;
  currency: string;
  credential: DelegatedCredential;
  customerId?: string;
  customerEmail?: string;
}

export interface DelegatedChargeResult {
  externalTransactionId: string;
  provider: string;
  status: 'paid';
}

export interface DelegatedPaymentPort {
  chargeDelegatedPayment(params: DelegatedChargeRequest): Promise<DelegatedChargeResult>;
}
