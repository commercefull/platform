/**
 * OrderPlacementPort
 *
 * ACL port owned by checkout. Creates, finds, updates, and cancels orders
 * through checkout's vocabulary — no OrderStatus/PaymentStatus types leak.
 *
 * Checkout holds its own CheckoutOutcome enum; the adapter maps it
 * to order's internal status values.
 */

interface OrderAddressInput {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  /** Canonical multi-line street (country-neutral superset of address1/2). */
  addressLines?: string[];
  city: string;
  /** Locality below city level (e.g. Brazilian bairro, JP district). */
  dependentLocality?: string;
  /** Administrative area — optional for countries without states (e.g. BE). */
  state?: string;
  /** Postal code — optional for countries without them (e.g. AE, HK). */
  postalCode?: string;
  /** Postal sorting code used by some postal systems (e.g. FR cedex). */
  sortingCode?: string;
  country: string;
  countryCode: string;
  phone?: string;
}

interface OrderItemInput {
  productId: string;
  productVariantId?: string;
  sku: string;
  name: string;
  quantity: number;
  /** Unit price in integer cents. */
  unitPriceCents: number;
  /** Discounted unit price in integer cents. */
  discountedUnitPriceCents?: number;
  /** Tax rate percentage. */
  taxRate?: number;
  /** Tax amount in integer cents. */
  taxAmountCents?: number;
  /** Line discount in integer cents. */
  discountAmountCents?: number;
  isDigital?: boolean;
  /** Recurring-purchase metadata carried from the basket line (subscription items). */
  subscriptionInfo?: Record<string, unknown>;
}

export interface CreateOrderRequest {
  customerId?: string;
  customerEmail: string;
  items: OrderItemInput[];
  shippingAddress: OrderAddressInput;
  billingAddress: OrderAddressInput;
  basketId: string;
  storeId?: string;
  channelId?: string;
  source: string;
  currency: string;
  notes?: string;
  /** Shipping total in integer cents. */
  shippingAmountCents: number;
  /** Authoritative tax total in integer cents (checkout tax quote, reported total). */
  taxAmountCents?: number;
  /** Portion of taxAmountCents added on top of subtotal+shipping (0 = fully tax-inclusive). Defaults per taxIncludedInSubtotal when absent. */
  taxAddedCents?: number;
  /** True when taxAmountCents is embedded in item prices (tax-inclusive pricing). */
  taxIncludedInSubtotal?: boolean;
  metadata?: Record<string, unknown>;
  // ---- Global commerce context resolved at the edge (snapshotted on the order) ----
  marketId?: string;
  localeCode?: string;
  contractingEntityId?: string;
  catalogCurrencyCode?: string;
  displayedCurrencyCode?: string;
  settlementCurrencyCode?: string;
  accountingCurrencyCode?: string;
  /** FX quotes applied during checkout — frozen on the order. */
  exchangeRateSnapshot?: Array<{ fromCurrency: string; toCurrency: string; rate: number; asOf: string }>;
  /** Named policy/rule versions active at decision time. */
  versionSnapshot?: Record<string, string | undefined>;
  /** Explainable decision records (tax, promotions, compliance). */
  decisionLog?: unknown[];
  /** Structured promotion-engine discounts → persisted to `orderDiscount`. */
  appliedPromotions?: Array<{
    promotionId?: string;
    code?: string;
    name?: string;
    discountAmountCents: number;
    targetId?: string;
    ruleId?: string;
    policyVersion?: string;
    decisionInputs?: Record<string, unknown>;
  }>;
  /** Tax engine line breakdown → persisted to `orderTax`. */
  taxLines?: Array<{
    orderItemId?: string;
    taxType?: string;
    name: string;
    rate: number;
    amountCents: number;
    jurisdiction?: string;
    taxProvider?: string;
    isIncludedInPrice?: boolean;
    taxRuleId?: string;
    taxRegime?: string;
    policyVersion?: string;
    decisionInputs?: Record<string, unknown>;
  }>;
}

interface OrderSnapshotItem {
  orderItemId: string;
  productId: string;
  productVariantId?: string;
}

export interface OrderSnapshot {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  /** Created order lines, in the same order as the request's items. */
  items?: OrderSnapshotItem[];
}

export type CheckoutOutcome = 'pending_payment' | 'processing' | 'cancelled' | 'completed';

export interface OrderPlacementPort {
  createOrder(request: CreateOrderRequest): Promise<OrderSnapshot>;
  findOrder(orderId: string): Promise<OrderSnapshot | null>;
  updateOrderStatus(orderId: string, outcome: CheckoutOutcome): Promise<void>;
  cancelOrder(orderId: string, reason: string): Promise<void>;
}
