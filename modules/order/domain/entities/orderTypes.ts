/**
 * Order entity type declarations.
 *
 * Split from Order.ts — re-exported there for compatibility.
 */

import { OrderItem } from './OrderItem';
import { OrderAddress } from './OrderAddress';
import { Money } from '../valueObjects/Money';
import { OrderStatus } from '../valueObjects/OrderStatus';
import { PaymentStatus } from '../valueObjects/PaymentStatus';
import { FulfillmentStatus } from '../valueObjects/FulfillmentStatus';
import type { PolicyDecisionRecord } from '../../../../libs/rules/policyEngine';

/** Named version markers captured at order time for later replay. */
export interface OrderVersionSnapshot {
  marketVersion?: string;
  pricingVersion?: string;
  promotionVersion?: string;
  taxPolicyVersion?: string;
  returnPolicyVersion?: string;
  termsVersion?: string;
  consentVersion?: string;
  [key: string]: string | undefined;
}

/** One FX quote persisted at order time. */
export interface OrderExchangeRateQuote {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  /** ISO timestamp the rate was quoted at. */
  asOf: string;
}

export type OrderExchangeRateSnapshot = OrderExchangeRateQuote[];

export interface OrderProps {
  orderId: string;
  orderNumber: string;
  customerId?: string;
  basketId?: string;
  storeId?: string;
  channelId?: string;
  createdByUserId?: string;
  /** Selling market the order was placed in. */
  marketId?: string;
  /** Locale the customer checked out in (BCP-47). */
  localeCode?: string;
  /** Legal entity that contracted the sale. */
  contractingEntityId?: string;
  orderSource: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  /** Transaction (presentment) currency — what the customer was charged. */
  currencyCode: string;
  /** Catalog currency the prices were sourced in (pre-conversion). */
  catalogCurrencyCode?: string;
  /** Currency the customer browsed in before payment. */
  displayedCurrencyCode?: string;
  /** Currency the PSP settles in. */
  settlementCurrencyCode?: string;
  /** Organization reporting/accounting currency. */
  accountingCurrencyCode?: string;
  /** FX quotes used for any currency conversion, frozen at order time. */
  exchangeRateSnapshot?: OrderExchangeRateSnapshot;
  /** Policy/rule versions that governed this order, frozen at order time. */
  versionSnapshot?: OrderVersionSnapshot;
  /** Explainable decisions made during checkout (tax, compliance, promos). */
  decisionLog?: PolicyDecisionRecord[];
  subtotal: Money;
  discountTotal: Money;
  taxTotal: Money;
  shippingTotal: Money;
  handlingFee: Money;
  totalAmount: Money;
  totalItems: number;
  totalQuantity: number;
  taxExempt: boolean;
  orderDate: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  returnedAt?: Date;
  shippingAddress?: OrderAddress;
  billingAddress?: OrderAddress;
  customerEmail: string;
  customerPhone?: string;
  customerName?: string;
  customerNotes?: string;
  adminNotes?: string;
  ipAddress?: string;
  userAgent?: string;
  referralSource?: string;
  estimatedDeliveryDate?: Date;
  hasGiftWrapping: boolean;
  giftMessage?: string;
  isGift: boolean;
  isSubscriptionOrder: boolean;
  parentOrderId?: string;
  items: OrderItem[];
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/** Input accepted by Order.create — omitted fields get domain defaults. */
export interface CreateOrderInput {
  orderId: string;
  orderNumber?: string;
  customerId?: string;
  basketId?: string;
  storeId?: string;
  channelId?: string;
  createdByUserId?: string;
  marketId?: string;
  localeCode?: string;
  contractingEntityId?: string;
  orderSource?: string;
  currencyCode?: string;
  customerEmail: string;
  customerPhone?: string;
  customerName?: string;
  customerNotes?: string;
  ipAddress?: string;
  userAgent?: string;
  referralSource?: string;
  hasGiftWrapping?: boolean;
  giftMessage?: string;
  isGift?: boolean;
  isSubscriptionOrder?: boolean;
  parentOrderId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}
