/**
 * CheckoutSession types and serializer
 * Shared prop/type declarations and JSON mapping for the aggregate root.
 */

import { Address } from '../valueObjects/Address';
import { Money } from '../../../../libs/money';

export type CheckoutStatus = 'active' | 'pending_payment' | 'processing' | 'completed' | 'abandoned' | 'expired' | 'failed';
export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';
export type FulfillmentType = 'shipping' | 'pickup' | 'local_delivery' | 'digital';

/**
 * One promotion applied to the session — the structured record that
 * replaces the opaque `'AUTO_PROMOTION'` coupon string. Persisted on the
 * session and copied to `orderDiscount` rows at order creation.
 */
export interface AppliedPromotion {
  promotionId: string;
  promotionCode?: string;
  name?: string;
  /** Discount for this promotion in session-currency minor units. */
  discountAmountCents: number;
  targetType?: 'order' | 'line_item' | 'shipping';
  targetId?: string;
  ruleId?: string;
  policyVersion?: string;
}

export interface CheckoutSessionProps {
  id: string;
  customerId?: string;
  guestEmail?: string;
  basketId: string;
  /** Selling market + store/channel/locale context resolved at session start. */
  marketId?: string;
  storeId?: string;
  channelId?: string;
  localeCode?: string;
  status: CheckoutStatus;
  paymentStatus: PaymentStatus;
  shippingAddress?: Address;
  billingAddress?: Address;
  sameAsShipping: boolean;
  shippingMethodId?: string;
  shippingMethodName?: string;
  paymentMethodId?: string;
  paymentIntentId?: string;
  orderId?: string;
  subtotal: Money;
  taxAmount: Money;
  /** True when taxAmount is embedded in subtotal/shipping (tax-inclusive pricing) and must not be added to the total */
  taxIncludedInSubtotal?: boolean;
  /**
   * The portion of taxAmount added on top of subtotal + shipping. Absent
   * means: all of taxAmount when taxIncludedInSubtotal is false, zero when
   * true. Explicit value supports mixed quotes (some lines tax-inclusive).
   */
  taxAddedAmount?: Money;
  shippingAmount: Money;
  discountAmount: Money;
  total: Money;
  couponCode?: string;
  /** Structured promotions applied by the promotion engine. */
  appliedPromotions?: AppliedPromotion[];
  /** Total promotion discount (overlaps couponCode path until that merges). */
  promotionDiscountAmount?: Money;
  /** Loyalty reward applied to this session — points are debited at the payment boundary. */
  loyaltyRewardId?: string;
  loyaltyPointsRedeemed?: number;
  loyaltyDiscountAmount?: Money;
  /** Customer VAT ID (B2B) — validated during tax quoting. */
  vatNumber?: string;
  /** True when the tax quote applied intra-EU B2B reverse charge. */
  reverseChargeApplied?: boolean;
  fulfillmentType: FulfillmentType;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

/** Serialize the session props; billing/ready state come from the entity getters. */
export function checkoutSessionToJSON(
  props: CheckoutSessionProps,
  billingAddress: Address | undefined,
  isReadyForPayment: boolean,
): Record<string, unknown> {
  return {
    id: props.id,
    customerId: props.customerId,
    guestEmail: props.guestEmail,
    basketId: props.basketId,
    marketId: props.marketId,
    storeId: props.storeId,
    channelId: props.channelId,
    localeCode: props.localeCode,
    status: props.status,
    paymentStatus: props.paymentStatus,
    shippingAddress: props.shippingAddress?.toJSON(),
    billingAddress: billingAddress?.toJSON(),
    sameAsShipping: props.sameAsShipping,
    shippingMethodId: props.shippingMethodId,
    shippingMethodName: props.shippingMethodName,
    paymentMethodId: props.paymentMethodId,
    paymentIntentId: props.paymentIntentId,
    orderId: props.orderId,
    subtotal: props.subtotal.amount,
    taxAmount: props.taxAmount.amount,
    taxIncludedInSubtotal: props.taxIncludedInSubtotal ?? false,
    shippingAmount: props.shippingAmount.amount,
    discountAmount: props.discountAmount.amount,
    total: props.total.amount,
    currency: props.subtotal.currency,
    couponCode: props.couponCode,
    appliedPromotions: props.appliedPromotions,
    promotionDiscountAmount: props.promotionDiscountAmount?.amount,
    fulfillmentType: props.fulfillmentType,
    notes: props.notes,
    metadata: props.metadata,
    isReadyForPayment,
    createdAt: props.createdAt.toISOString(),
    updatedAt: props.updatedAt.toISOString(),
    completedAt: props.completedAt?.toISOString(),
    expiresAt: props.expiresAt.toISOString(),
  };
}
