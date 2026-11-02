export interface OrderTax {
  orderTaxId: string;
  createdAt: Date;
  updatedAt: Date;
  orderId: string;
  orderItemId?: string;
  taxType: string;
  name: string;
  /** Tax rate percentage. */
  rate: number;
  /** Tax amount in integer cents. */
  amountCents: number;
  jurisdiction?: string;
  taxProvider?: string;
  providerTaxId?: string;
  isIncludedInPrice: boolean;
  /** Tax rule that produced this line. */
  taxRuleId?: string;
  /** Regime applied (DOMESTIC, EU_B2C_OSS, REVERSE_CHARGE, EXPORT, NO_TAX). */
  taxRegime?: string;
  /** Tax policy version applied at decision time — replay key for refunds. */
  policyVersion?: string;
  /** Facts evaluated by the tax engine when the amount was decided. */
  decisionInputs?: Record<string, unknown>;
}

export type OrderTaxCreateParams = Omit<OrderTax, 'orderTaxId' | 'createdAt' | 'updatedAt'>;


