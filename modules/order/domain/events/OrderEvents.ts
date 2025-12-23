/**
 * Order Domain Events
 * Events that occur within the order domain
 */

import { OrderStatus } from '../valueObjects/OrderStatus';
import { PaymentStatus } from '../valueObjects/PaymentStatus';
import { FulfillmentStatus } from '../valueObjects/FulfillmentStatus';

export interface DomainEvent {
  eventType: string;
  occurredAt: Date;
  aggregateId: string;
  payload: Record<string, any>;
}

export class OrderCreatedEvent implements DomainEvent {
  readonly eventType = 'order.created';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    orderId: string;
    orderNumber: string;
    customerId?: string;
    basketId?: string;
    totalAmount: number;
    currency: string;
  };

  constructor(orderId: string, orderNumber: string, totalAmount: number, currency: string, customerId?: string, basketId?: string) {
    this.occurredAt = new Date();
    this.aggregateId = orderId;
    this.payload = { orderId, orderNumber, customerId, basketId, totalAmount, currency };
  }
}

export class OrderStatusChangedEvent implements DomainEvent {
  readonly eventType = 'order.status_changed';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    orderId: string;
    orderNumber: string;
    previousStatus: OrderStatus;
    newStatus: OrderStatus;
    reason?: string;
  };

  constructor(orderId: string, orderNumber: string, previousStatus: OrderStatus, newStatus: OrderStatus, reason?: string) {
    this.occurredAt = new Date();
    this.aggregateId = orderId;
    this.payload = { orderId, orderNumber, previousStatus, newStatus, reason };
  }
}

export class OrderPaymentStatusChangedEvent implements DomainEvent {
  readonly eventType = 'order.payment_status_changed';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    orderId: string;
    orderNumber: string;
    previousStatus: PaymentStatus;
    newStatus: PaymentStatus;
    transactionId?: string;
  };

  constructor(orderId: string, orderNumber: string, previousStatus: PaymentStatus, newStatus: PaymentStatus, transactionId?: string) {
    this.occurredAt = new Date();
    this.aggregateId = orderId;
    this.payload = { orderId, orderNumber, previousStatus, newStatus, transactionId };
  }
}

export class OrderFulfillmentStatusChangedEvent implements DomainEvent {
  readonly eventType = 'order.fulfillment_status_changed';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    orderId: string;
    orderNumber: string;
    previousStatus: FulfillmentStatus;
    newStatus: FulfillmentStatus;
  };

  constructor(orderId: string, orderNumber: string, previousStatus: FulfillmentStatus, newStatus: FulfillmentStatus) {
    this.occurredAt = new Date();
    this.aggregateId = orderId;
    this.payload = { orderId, orderNumber, previousStatus, newStatus };
  }
}

export class OrderCancelledEvent implements DomainEvent {
  readonly eventType = 'order.cancelled';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    orderId: string;
    orderNumber: string;
    customerId?: string;
    reason?: string;
    refundAmount?: number;
  };

  constructor(orderId: string, orderNumber: string, customerId?: string, reason?: string, refundAmount?: number) {
    this.occurredAt = new Date();
    this.aggregateId = orderId;
    this.payload = { orderId, orderNumber, customerId, reason, refundAmount };
  }
}

export class OrderRefundedEvent implements DomainEvent {
  readonly eventType = 'order.refunded';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    orderId: string;
    orderNumber: string;
    customerId?: string;
    refundAmount: number;
    reason: string;
    isFullRefund: boolean;
  };

  constructor(orderId: string, orderNumber: string, refundAmount: number, reason: string, isFullRefund: boolean, customerId?: string) {
    this.occurredAt = new Date();
    this.aggregateId = orderId;
    this.payload = { orderId, orderNumber, customerId, refundAmount, reason, isFullRefund };
  }
}

export class OrderShippedEvent implements DomainEvent {
  readonly eventType = 'order.shipped';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    orderId: string;
    orderNumber: string;
    customerId?: string;
    trackingNumber?: string;
    carrier?: string;
    estimatedDeliveryDate?: string;
  };

  constructor(
    orderId: string,
    orderNumber: string,
    customerId?: string,
    trackingNumber?: string,
    carrier?: string,
    estimatedDeliveryDate?: Date,
  ) {
    this.occurredAt = new Date();
    this.aggregateId = orderId;
    this.payload = {
      orderId,
      orderNumber,
      customerId,
      trackingNumber,
      carrier,
      estimatedDeliveryDate: estimatedDeliveryDate?.toISOString(),
    };
  }
}

export class OrderDeliveredEvent implements DomainEvent {
  readonly eventType = 'order.delivered';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    orderId: string;
    orderNumber: string;
    customerId?: string;
    deliveredAt: string;
  };

  constructor(orderId: string, orderNumber: string, customerId?: string) {
    this.occurredAt = new Date();
    this.aggregateId = orderId;
    this.payload = {
      orderId,
      orderNumber,
      customerId,
      deliveredAt: new Date().toISOString(),
    };
  }
}

export class OrderCompletedEvent implements DomainEvent {
  readonly eventType = 'order.completed';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    orderId: string;
    orderNumber: string;
    customerId?: string;
    totalAmount: number;
    completedAt: string;
  };

  constructor(orderId: string, orderNumber: string, totalAmount: number, customerId?: string) {
    this.occurredAt = new Date();
    this.aggregateId = orderId;
    this.payload = {
      orderId,
      orderNumber,
      customerId,
      totalAmount,
      completedAt: new Date().toISOString(),
    };
  }
}

export class OrderItemAddedEvent implements DomainEvent {
  readonly eventType = 'order.item_added';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    orderId: string;
    orderItemId: string;
    productId: string;
    productVariantId?: string;
    quantity: number;
    unitPrice: number;
  };

  constructor(orderId: string, orderItemId: string, productId: string, quantity: number, unitPrice: number, productVariantId?: string) {
    this.occurredAt = new Date();
    this.aggregateId = orderId;
    this.payload = { orderId, orderItemId, productId, productVariantId, quantity, unitPrice };
  }
}

export class OrderItemRemovedEvent implements DomainEvent {
  readonly eventType = 'order.item_removed';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    orderId: string;
    orderItemId: string;
    productId: string;
  };

  constructor(orderId: string, orderItemId: string, productId: string) {
    this.occurredAt = new Date();
    this.aggregateId = orderId;
    this.payload = { orderId, orderItemId, productId };
  }
}
