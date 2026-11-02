export type DiscountType = 'percentage' | 'fixedAmount' | 'freeShipping' | 'buyXGetY' | 'giftCard';

export interface OrderDiscount {
  orderDiscountId: string;
  createdAt: Date;
  updatedAt: Date;
  orderId: string;
  orderItemId?: string;
  code?: string;
  name: string;
  description?: string;
  type: DiscountType;
  /** Polymorphic operand: percentage or fixed amount. */
  value: number;
  /** Discount amount in integer cents. */
  discountAmountCents: number;
  /** Source promotion, when the discount came from the promotion engine. */
  promotionId?: string;
  /** Pricing/promotion rule that produced the discount. */
  ruleId?: string;
  /** Policy/rule version applied at decision time — replay key for refunds. */
  policyVersion?: string;
  /** Facts evaluated by the policy engine when the discount was decided. */
  decisionInputs?: Record<string, unknown>;
}

export type OrderDiscountCreateParams = Omit<OrderDiscount, 'orderDiscountId' | 'createdAt' | 'updatedAt'>;


