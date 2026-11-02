/**
 * DbOrder row → Order.reconstitute props projections.
 */

import { Order } from '../../domain/entities/Order';
import { OrderItem } from '../../domain/entities/OrderItem';
import { OrderAddress } from '../../domain/entities/OrderAddress';
import { Money } from '../../domain/valueObjects/Money';
import { OrderStatus } from '../../domain/valueObjects/OrderStatus';
import { PaymentStatus } from '../../domain/valueObjects/PaymentStatus';
import { FulfillmentStatus } from '../../domain/valueObjects/FulfillmentStatus';
import type { Order as DbOrder } from '../../../../libs/db/types';
import { fromJson, toDate } from './orderRowMappers';

function orderIdentityFromRow(row: DbOrder) {
  return {
    orderId: row.orderId,
    orderNumber: row.orderNumber,
    customerId: row.customerId ?? undefined,
    basketId: row.basketId ?? undefined,
    storeId: row.storeId ?? undefined,
    channelId: row.channelId ?? undefined,
    createdByUserId: row.createdByUserId ?? undefined,
    orderSource: row.orderSource || 'web',
    status: row.status as OrderStatus,
    paymentStatus: row.paymentStatus as PaymentStatus,
    fulfillmentStatus: row.fulfillmentStatus as FulfillmentStatus,
    currencyCode: row.currencyCode || 'USD',
    orderDate: new Date(row.orderDate),
  };
}

function orderMoneyFromRow(row: DbOrder, currency: string) {
  return {
    subtotal: Money.fromCents(Number(row.subtotalCents || '0'), currency),
    discountTotal: Money.fromCents(Number(row.discountTotalCents || '0'), currency),
    taxTotal: Money.fromCents(Number(row.taxTotalCents || '0'), currency),
    shippingTotal: Money.fromCents(Number(row.shippingTotalCents || '0'), currency),
    handlingFee: Money.fromCents(Number(row.handlingFeeCents || '0'), currency),
    totalAmount: Money.fromCents(Number(row.totalAmountCents || '0'), currency),
    totalItems: row.totalItems || 0,
    totalQuantity: row.totalQuantity || 0,
    taxExempt: Boolean(row.taxExempt),
  };
}

function orderLifecycleFromRow(row: DbOrder) {
  return {
    completedAt: toDate(row.completedAt),
    cancelledAt: toDate(row.cancelledAt),
    returnedAt: toDate(row.returnedAt),
    estimatedDeliveryDate: toDate(row.estimatedDeliveryDate),
  };
}

function orderContactFromRow(row: DbOrder) {
  return {
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone ?? undefined,
    customerName: row.customerName ?? undefined,
    customerNotes: row.customerNotes ?? undefined,
    adminNotes: row.adminNotes ?? undefined,
    ipAddress: row.ipAddress ?? undefined,
    userAgent: row.userAgent ?? undefined,
    referralSource: row.referralSource ?? undefined,
  };
}

function orderContextFromRow(row: DbOrder) {
  return {
    hasGiftWrapping: Boolean(row.hasGiftWrapping),
    giftMessage: row.giftMessage ?? undefined,
    isGift: Boolean(row.isGift),
    isSubscriptionOrder: Boolean(row.isSubscriptionOrder),
    parentOrderId: row.parentOrderId ?? undefined,
    tags: fromJson<string[]>(row.tags) ?? [],
    metadata: fromJson<Record<string, unknown>>(row.metadata),
    marketId: row.marketId ?? undefined,
    localeCode: row.localeCode ?? undefined,
    contractingEntityId: row.contractingEntityId ?? undefined,
    catalogCurrencyCode: row.catalogCurrencyCode ?? undefined,
    displayedCurrencyCode: row.displayedCurrencyCode ?? undefined,
    settlementCurrencyCode: row.settlementCurrencyCode ?? undefined,
    accountingCurrencyCode: row.accountingCurrencyCode ?? undefined,
    exchangeRateSnapshot: fromJson<Order['exchangeRateSnapshot']>(row.exchangeRateSnapshot),
    versionSnapshot: (fromJson(row.versionSnapshot) ?? {}) as Order['versionSnapshot'],
    decisionLog: (fromJson(row.decisionLog) ?? []) as Order['decisionLog'],
  };
}

export function mapOrderRow(row: DbOrder, items: OrderItem[], shippingAddress: OrderAddress | null, billingAddress: OrderAddress | null): Order {
  const currency = row.currencyCode || 'USD';

  return Order.reconstitute({
    ...orderIdentityFromRow(row),
    ...orderMoneyFromRow(row, currency),
    ...orderLifecycleFromRow(row),
    ...orderContactFromRow(row),
    ...orderContextFromRow(row),
    shippingAddress: shippingAddress || undefined,
    billingAddress: billingAddress || undefined,
    items,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    deletedAt: toDate(row.deletedAt),
  });
}
