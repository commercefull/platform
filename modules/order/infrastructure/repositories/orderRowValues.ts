/**
 * Order → DB row value builders, keyed for the order INSERT/UPDATE columns.
 */

import { Order } from '../../domain/entities/Order';

function orderCoreValues(order: Order): Record<string, unknown> {
  return {
    customerId: order.customerId || null,
    basketId: order.basketId || null,
    storeId: order.storeId || null,
    channelId: order.channelId || null,
    createdByUserId: order.createdByUserId || null,
    orderSource: order.orderSource,
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    currencyCode: order.currencyCode,
  };
}

function orderMonetaryValues(order: Order): Record<string, unknown> {
  return {
    subtotalCents: order.subtotal.cents,
    discountTotalCents: order.discountTotal.cents,
    taxTotalCents: order.taxTotal.cents,
    shippingTotalCents: order.shippingTotal.cents,
    handlingFeeCents: order.handlingFee.cents,
    totalAmountCents: order.totalAmount.cents,
    totalItems: order.totalItems,
    totalQuantity: order.totalQuantity,
    taxExempt: order.taxExempt,
  };
}

function orderLifecycleValues(order: Order): Record<string, unknown> {
  return {
    completedAt: order.completedAt?.toISOString() || null,
    cancelledAt: order.cancelledAt?.toISOString() || null,
    returnedAt: order.returnedAt?.toISOString() || null,
    estimatedDeliveryDate: order.estimatedDeliveryDate?.toISOString() || null,
  };
}

function orderContactValues(order: Order): Record<string, unknown> {
  return {
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone || null,
    customerName: order.customerName || null,
    customerNotes: order.customerNotes || null,
    adminNotes: order.adminNotes || null,
    ipAddress: order.ipAddress || null,
    userAgent: order.userAgent || null,
    referralSource: order.referralSource || null,
  };
}

function orderContextValues(order: Order): Record<string, unknown> {
  return {
    hasGiftWrapping: order.hasGiftWrapping,
    giftMessage: order.giftMessage || null,
    isGift: order.isGift,
    isSubscriptionOrder: order.isSubscriptionOrder,
    parentOrderId: order.parentOrderId || null,
    tags: order.tags.length > 0 ? JSON.stringify(order.tags) : null,
    metadata: order.metadata ? JSON.stringify(order.metadata) : null,
    marketId: order.marketId || null,
    localeCode: order.localeCode || null,
    contractingEntityId: order.contractingEntityId || null,
    catalogCurrencyCode: order.catalogCurrencyCode || null,
    displayedCurrencyCode: order.displayedCurrencyCode || null,
    settlementCurrencyCode: order.settlementCurrencyCode || null,
    accountingCurrencyCode: order.accountingCurrencyCode || null,
    exchangeRateSnapshot: order.exchangeRateSnapshot ? JSON.stringify(order.exchangeRateSnapshot) : null,
    versionSnapshot: JSON.stringify(order.versionSnapshot ?? {}),
    decisionLog: JSON.stringify(order.decisionLog ?? []),
  };
}

export function orderRowValues(order: Order, now: string): Record<string, unknown> {
  return {
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    orderDate: order.orderDate.toISOString(),
    createdAt: now,
    updatedAt: now,
    ...orderCoreValues(order),
    ...orderMonetaryValues(order),
    ...orderLifecycleValues(order),
    ...orderContactValues(order),
    ...orderContextValues(order),
  };
}
