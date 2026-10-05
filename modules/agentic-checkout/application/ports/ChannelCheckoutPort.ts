/**
 * ChannelCheckoutPort
 *
 * ACL port owned by agentic-checkout. Bridges the basket + checkout modules'
 * use cases into this module's vocabulary — the surface-facing session
 * operations never reference basket/checkout types directly.
 */

export interface ChannelAddressInput {
  firstName?: string;
  lastName?: string;
  lineOne: string;
  lineTwo?: string;
  city: string;
  region?: string;
  country: string;
  postalCode: string;
  phone?: string;
}

export interface ChannelItemInput {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  productVariantId?: string;
  imageUrl?: string;
}

export interface ChannelBasketItem {
  basketItemId: string;
  productId: string;
  productVariantId?: string;
  sku: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  imageUrl?: string;
}

export interface ChannelShippingOption {
  methodId: string;
  methodName: string;
  amountCents: number;
  currency: string;
  estimatedDays?: number;
  carrier?: string;
}

export interface ChannelCheckoutSnapshot {
  checkoutId: string;
  basketId: string;
  status: string;
  paymentStatus: string;
  isReadyForPayment: boolean;
  guestEmail?: string;
  fulfillmentType: string;
  shippingAddress?: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    city: string;
    postalCode: string;
    country: string;
  };
  shippingMethodId?: string;
  shippingMethodName?: string;
  paymentMethodId?: string;
  subtotalCents: number;
  taxAmountCents: number;
  shippingAmountCents: number;
  discountAmountCents: number;
  totalCents: number;
  currency: string;
  couponCode?: string;
  expiresAt: Date;
}

export interface ChannelCompletionResult {
  orderId: string;
  orderNumber: string;
  paymentIntentId: string;
}

export interface DelegatedCredential {
  /** Payment handler id, e.g. 'stripe' */
  provider: string;
  /** ACP credential type, e.g. 'spt' (Stripe Shared Payment Token) */
  credentialType: string;
  /** Opaque delegated token issued by the surface's PSP */
  token: string;
}

export interface ChannelCheckoutPort {
  createBasket(params: { sessionId: string; storeId?: string; salesChannelId?: string; currency?: string }): Promise<{ basketId: string }>;
  getBasket(basketId: string): Promise<{ basketId: string; currency: string; channelId?: string; items: ChannelBasketItem[] } | null>;
  addItem(basketId: string, item: ChannelItemInput): Promise<void>;
  updateItemQuantity(basketId: string, basketItemId: string, quantity: number): Promise<void>;
  removeItem(basketId: string, basketItemId: string): Promise<void>;

  initiateCheckout(basketId: string, guestEmail?: string): Promise<ChannelCheckoutSnapshot>;
  getCheckout(checkoutId: string): Promise<ChannelCheckoutSnapshot | null>;
  setShippingAddress(checkoutId: string, address: ChannelAddressInput): Promise<ChannelCheckoutSnapshot>;
  setFulfillmentMethod(checkoutId: string, fulfillmentType: string): Promise<ChannelCheckoutSnapshot>;
  setShippingMethod(checkoutId: string, methodId: string): Promise<ChannelCheckoutSnapshot>;
  applyCoupon(checkoutId: string, couponCode: string): Promise<ChannelCheckoutSnapshot>;
  getShippingOptions(checkoutId: string): Promise<ChannelShippingOption[]>;

  /**
   * Attaches a surface-issued delegated credential (e.g. Stripe SPT) to the
   * checkout session. Stored on session metadata — the payment module reads
   * it at authorization time. PCI boundary preserved: the token is opaque.
   */
  attachDelegatedPayment(checkoutId: string, credential: DelegatedCredential): Promise<void>;

  createPaymentIntent(checkoutId: string): Promise<{ orderId: string; orderNumber: string; paymentIntentId: string }>;
  completeCheckout(checkoutId: string): Promise<ChannelCompletionResult>;
  abandonCheckout(checkoutId: string): Promise<void>;
}
