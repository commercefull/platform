/**
 * Order-building helpers for CreatePaymentIntentUseCase.
 * Maps checkout session state into order-placement inputs.
 */

import { CheckoutSession } from '../../domain/entities/CheckoutSession';
import { Address } from '../../domain/valueObjects/Address';
import { BasketSnapshot, CheckoutLineSnapshot } from '../ports/BasketSnapshotPort';
import { OrderAddressInput, OrderItemInput, OrderPlacementPort } from '../ports/OrderPlacementPort';
import { CheckoutValidationError } from '../../domain/errors/CheckoutErrors';

interface PickupAddressData {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface BillingAddressLike {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1?: string;
  addressLine2?: string;
  address1?: string;
  address2?: string;
  city: string;
  region?: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface OrderInput {
  orderItems: OrderItemInput[];
  shippingAddressInput: OrderAddressInput;
  billingAddressInput: OrderAddressInput;
  customerEmail: string;
}

// Build shipping + billing address inputs for order creation.
// For pickup orders, use the pickup location address from metadata.
export function buildOrderAddresses(session: CheckoutSession): {
  shippingAddressInput: OrderAddressInput;
  billingAddressInput: OrderAddressInput;
} {
  const isPickup = session.fulfillmentType === 'pickup';
  const sa = session.shippingAddress;

  if (!sa && !isPickup) {
    throw new CheckoutValidationError('Shipping address is required');
  }

  const shippingAddressInput: OrderAddressInput = sa ? toOrderAddress(sa) : pickupOrderAddress(session);

  const ba: BillingAddressLike | null = session.billingAddress
    ? (session.billingAddress as unknown as BillingAddressLike)
    : sa
      ? (sa as unknown as BillingAddressLike)
      : null;
  const billingAddressInput: OrderAddressInput = ba ? toBillingAddressInput(ba) : shippingAddressInput;

  return { shippingAddressInput, billingAddressInput };
}

function toOrderAddress(sa: Address): OrderAddressInput {
  return {
    firstName: sa.firstName,
    lastName: sa.lastName,
    company: sa.company,
    address1: sa.addressLine1,
    address2: sa.addressLine2,
    city: sa.city,
    state: sa.region || '',
    postalCode: sa.postalCode,
    country: sa.country,
    countryCode: sa.country,
    phone: sa.phone,
  };
}

function pickupOrderAddress(session: CheckoutSession): OrderAddressInput {
  const pickupAddr = (session.metadata?.pickupAddress ?? {}) as PickupAddressData;
  return {
    firstName: 'Pickup',
    lastName: 'Customer',
    address1: pickupAddr.line1 || '',
    address2: pickupAddr.line2,
    city: pickupAddr.city || '',
    state: pickupAddr.state || '',
    postalCode: pickupAddr.postalCode || '',
    country: pickupAddr.country || '',
    countryCode: pickupAddr.country || '',
  };
}

function toBillingAddressInput(ba: BillingAddressLike): OrderAddressInput {
  return {
    firstName: ba.firstName,
    lastName: ba.lastName,
    company: ba.company,
    address1: ba.addressLine1 || ba.address1 || '',
    address2: ba.addressLine2 || ba.address2,
    city: ba.city,
    state: ba.region || ba.state || '',
    postalCode: ba.postalCode,
    country: ba.country,
    countryCode: ba.country,
    phone: ba.phone,
  };
}

// Map basket items to order items. Subscription lines carry a marker
// so downstream provisioning can pick them up.
export function buildOrderItems(basketItems: CheckoutLineSnapshot[]): OrderItemInput[] {
  return basketItems.map(item => ({
    productId: item.productId,
    productVariantId: item.productVariantId,
    sku: item.sku || 'N/A',
    name: item.name || 'Product',
    quantity: item.quantity,
    unitPriceCents: item.unitPrice?.cents ?? 0,
    isDigital: item.isDigital,
    subscriptionInfo: item.itemType === 'subscription' ? { itemType: 'subscription' } : undefined,
  }));
}

/** Build the createOrder request from session + repriced basket state. */
export function buildCreateOrderRequest(
  session: CheckoutSession,
  basket: BasketSnapshot,
  orderInput: OrderInput,
): Parameters<OrderPlacementPort['createOrder']>[0] {
  const taxDecision = session.metadata?.taxDecision as
    | {
        taxRegime?: string;
        taxPolicyVersion?: string;
        decisionRecord?: unknown;
        lineItems?: Array<{ productId: string; name: string; taxAmountCents: number; taxRate: number }>;
      }
    | undefined;

  return {
    customerId: session.customerId,
    customerEmail: orderInput.customerEmail,
    items: orderInput.orderItems,
    shippingAddress: orderInput.shippingAddressInput,
    billingAddress: orderInput.billingAddressInput,
    basketId: session.basketId,
    storeId: basket.storeId,
    channelId: basket.channelId,
    source: 'checkout',
    currency: session.total.currency,
    notes: session.notes,
    shippingAmountCents: session.shippingAmount.cents,
    taxAmountCents: session.taxAmount.cents,
    taxAddedCents: session.taxAddedAmount.cents,
    taxIncludedInSubtotal: session.taxIncludedInSubtotal,
    marketId: session.marketId,
    localeCode: session.localeCode,
    catalogCurrencyCode: basket.currency,
    displayedCurrencyCode: session.total.currency,
    versionSnapshot: {
      marketVersion: session.marketId ? String(session.metadata?.marketVersion ?? '') : undefined,
      taxPolicyVersion: taxDecision?.taxPolicyVersion,
    },
    decisionLog: taxDecision?.decisionRecord ? [taxDecision.decisionRecord] : undefined,
    appliedPromotions: session.appliedPromotions.map(p => ({
      promotionId: p.promotionId,
      code: p.promotionCode,
      name: p.name,
      discountAmountCents: p.discountAmountCents,
      targetId: p.targetId,
      ruleId: p.ruleId,
      policyVersion: p.policyVersion,
    })),
    taxLines: taxDecision?.lineItems?.map(line => ({
      name: line.name,
      rate: line.taxRate,
      amountCents: line.taxAmountCents,
      taxRegime: taxDecision.taxRegime,
      policyVersion: taxDecision.taxPolicyVersion,
    })),
    metadata: {
      ...session.metadata,
      vatNumber: session.vatNumber,
      reverseChargeApplied: session.reverseChargeApplied || undefined,
    },
  };
}
