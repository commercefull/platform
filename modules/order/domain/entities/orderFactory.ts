/**
 * Order factory — builds the initial OrderProps for a new order.
 */

import { Money } from '../valueObjects/Money';
import { OrderStatus } from '../valueObjects/OrderStatus';
import { PaymentStatus } from '../valueObjects/PaymentStatus';
import { FulfillmentStatus } from '../valueObjects/FulfillmentStatus';
import type { CreateOrderInput, OrderProps } from './orderTypes';

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export function initialOrderProps(props: CreateOrderInput): OrderProps {
  const now = new Date();
  const currency = props.currencyCode || 'USD';

  return {
    orderId: props.orderId,
    orderNumber: props.orderNumber || generateOrderNumber(),
    customerId: props.customerId,
    basketId: props.basketId,
    storeId: props.storeId,
    channelId: props.channelId,
    createdByUserId: props.createdByUserId,
    marketId: props.marketId,
    localeCode: props.localeCode,
    contractingEntityId: props.contractingEntityId,
    orderSource: props.orderSource || 'web',
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
    currencyCode: currency,
    subtotal: Money.zero(currency),
    discountTotal: Money.zero(currency),
    taxTotal: Money.zero(currency),
    shippingTotal: Money.zero(currency),
    handlingFee: Money.zero(currency),
    totalAmount: Money.zero(currency),
    totalItems: 0,
    totalQuantity: 0,
    taxExempt: false,
    orderDate: now,
    customerEmail: props.customerEmail,
    customerPhone: props.customerPhone,
    customerName: props.customerName,
    customerNotes: props.customerNotes,
    ipAddress: props.ipAddress,
    userAgent: props.userAgent,
    referralSource: props.referralSource,
    hasGiftWrapping: props.hasGiftWrapping || false,
    giftMessage: props.giftMessage,
    isGift: props.isGift || false,
    isSubscriptionOrder: props.isSubscriptionOrder || false,
    parentOrderId: props.parentOrderId,
    items: [],
    tags: props.tags || [],
    metadata: props.metadata,
    createdAt: now,
    updatedAt: now,
  };
}
