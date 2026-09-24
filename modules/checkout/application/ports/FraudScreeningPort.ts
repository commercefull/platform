/**
 * FraudScreeningPort
 *
 * ACL port owned by checkout. Screens an order for fraud risk before
 * payment authorization. Returns a decision (approved/review/blocked)
 * and a risk score in checkout's vocabulary — no payment/fraud domain
 * types leak.
 *
 * See `docs/e2e-rule-engine-implementation-plan.md` Epic G.
 */

export type FraudScreeningDecision = 'approved' | 'review' | 'blocked';

export interface FraudScreeningRequest {
  checkoutId: string;
  orderId?: string;
  customerId?: string;
  customerEmail?: string;
  ipAddress?: string;
  billingCountry?: string;
  shippingCountry?: string;
  orderAmountCents: number;
  currency: string;
  paymentMethodId?: string;
  isFirstOrder?: boolean;
  isGuestCheckout?: boolean;
}

export interface FraudScreeningResult {
  decision: FraudScreeningDecision;
  riskScore: number;
  riskLevel: string;
  triggeredRules: Array<{ ruleId: string; name: string; action: string }>;
}

export interface FraudScreeningPort {
  screenOrder(request: FraudScreeningRequest): Promise<FraudScreeningResult>;
}
