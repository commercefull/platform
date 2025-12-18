/**
 * Checkout Domain Events
 * Events that occur within the checkout domain
 */

export interface DomainEvent {
  eventType: string;
  occurredAt: Date;
  aggregateId: string;
  payload: Record<string, any>;
}

export class CheckoutStartedEvent implements DomainEvent {
  readonly eventType = 'checkout.started';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    checkoutId: string;
    basketId: string;
    customerId?: string;
    guestEmail?: string;
  };

  constructor(checkoutId: string, basketId: string, customerId?: string, guestEmail?: string) {
    this.occurredAt = new Date();
    this.aggregateId = checkoutId;
    this.payload = { checkoutId, basketId, customerId, guestEmail };
  }
}

export class ShippingAddressSetEvent implements DomainEvent {
  readonly eventType = 'checkout.shipping_address_set';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    checkoutId: string;
    country: string;
    postalCode: string;
  };

  constructor(checkoutId: string, country: string, postalCode: string) {
    this.occurredAt = new Date();
    this.aggregateId = checkoutId;
    this.payload = { checkoutId, country, postalCode };
  }
}

export class ShippingMethodSelectedEvent implements DomainEvent {
  readonly eventType = 'checkout.shipping_method_selected';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    checkoutId: string;
    methodId: string;
    methodName: string;
    amount: number;
  };

  constructor(checkoutId: string, methodId: string, methodName: string, amount: number) {
    this.occurredAt = new Date();
    this.aggregateId = checkoutId;
    this.payload = { checkoutId, methodId, methodName, amount };
  }
}

export class PaymentInitiatedEvent implements DomainEvent {
  readonly eventType = 'checkout.payment_initiated';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    checkoutId: string;
    paymentMethodId: string;
    paymentIntentId: string;
    amount: number;
  };

  constructor(checkoutId: string, paymentMethodId: string, paymentIntentId: string, amount: number) {
    this.occurredAt = new Date();
    this.aggregateId = checkoutId;
    this.payload = { checkoutId, paymentMethodId, paymentIntentId, amount };
  }
}

export class PaymentCompletedEvent implements DomainEvent {
  readonly eventType = 'checkout.payment_completed';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    checkoutId: string;
    paymentIntentId: string;
    amount: number;
  };

  constructor(checkoutId: string, paymentIntentId: string, amount: number) {
    this.occurredAt = new Date();
    this.aggregateId = checkoutId;
    this.payload = { checkoutId, paymentIntentId, amount };
  }
}

export class PaymentFailedEvent implements DomainEvent {
  readonly eventType = 'checkout.payment_failed';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    checkoutId: string;
    reason: string;
  };

  constructor(checkoutId: string, reason: string) {
    this.occurredAt = new Date();
    this.aggregateId = checkoutId;
    this.payload = { checkoutId, reason };
  }
}

export class CheckoutCompletedEvent implements DomainEvent {
  readonly eventType = 'checkout.completed';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    checkoutId: string;
    basketId: string;
    orderId: string;
    customerId?: string;
    total: number;
  };

  constructor(checkoutId: string, basketId: string, orderId: string, total: number, customerId?: string) {
    this.occurredAt = new Date();
    this.aggregateId = checkoutId;
    this.payload = { checkoutId, basketId, orderId, customerId, total };
  }
}

export class CheckoutAbandonedEvent implements DomainEvent {
  readonly eventType = 'checkout.abandoned';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    checkoutId: string;
    basketId: string;
    customerId?: string;
    lastStep: string;
    totalValue: number;
  };

  constructor(checkoutId: string, basketId: string, lastStep: string, totalValue: number, customerId?: string) {
    this.occurredAt = new Date();
    this.aggregateId = checkoutId;
    this.payload = { checkoutId, basketId, customerId, lastStep, totalValue };
  }
}

export class CouponAppliedEvent implements DomainEvent {
  readonly eventType = 'checkout.coupon_applied';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    checkoutId: string;
    couponCode: string;
    discountAmount: number;
  };

  constructor(checkoutId: string, couponCode: string, discountAmount: number) {
    this.occurredAt = new Date();
    this.aggregateId = checkoutId;
    this.payload = { checkoutId, couponCode, discountAmount };
  }
}
