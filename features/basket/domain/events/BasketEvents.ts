/**
 * Basket Domain Events
 * Events that occur within the basket domain
 */

export interface DomainEvent {
  eventType: string;
  occurredAt: Date;
  aggregateId: string;
  payload: Record<string, any>;
}

export class BasketCreatedEvent implements DomainEvent {
  readonly eventType = 'basket.created';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    basketId: string;
    customerId?: string;
    sessionId?: string;
    currency: string;
  };

  constructor(basketId: string, customerId?: string, sessionId?: string, currency: string = 'USD') {
    this.occurredAt = new Date();
    this.aggregateId = basketId;
    this.payload = { basketId, customerId, sessionId, currency };
  }
}

export class ItemAddedToBasketEvent implements DomainEvent {
  readonly eventType = 'basket.item_added';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    basketId: string;
    basketItemId: string;
    productId: string;
    productVariantId?: string;
    quantity: number;
    unitPrice: number;
  };

  constructor(
    basketId: string,
    basketItemId: string,
    productId: string,
    quantity: number,
    unitPrice: number,
    productVariantId?: string
  ) {
    this.occurredAt = new Date();
    this.aggregateId = basketId;
    this.payload = { basketId, basketItemId, productId, productVariantId, quantity, unitPrice };
  }
}

export class ItemRemovedFromBasketEvent implements DomainEvent {
  readonly eventType = 'basket.item_removed';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    basketId: string;
    basketItemId: string;
    productId: string;
  };

  constructor(basketId: string, basketItemId: string, productId: string) {
    this.occurredAt = new Date();
    this.aggregateId = basketId;
    this.payload = { basketId, basketItemId, productId };
  }
}

export class ItemQuantityUpdatedEvent implements DomainEvent {
  readonly eventType = 'basket.item_quantity_updated';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    basketId: string;
    basketItemId: string;
    oldQuantity: number;
    newQuantity: number;
  };

  constructor(basketId: string, basketItemId: string, oldQuantity: number, newQuantity: number) {
    this.occurredAt = new Date();
    this.aggregateId = basketId;
    this.payload = { basketId, basketItemId, oldQuantity, newQuantity };
  }
}

export class BasketClearedEvent implements DomainEvent {
  readonly eventType = 'basket.cleared';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    basketId: string;
    itemCount: number;
  };

  constructor(basketId: string, itemCount: number) {
    this.occurredAt = new Date();
    this.aggregateId = basketId;
    this.payload = { basketId, itemCount };
  }
}

export class BasketAbandonedEvent implements DomainEvent {
  readonly eventType = 'basket.abandoned';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    basketId: string;
    customerId?: string;
    itemCount: number;
    totalValue: number;
  };

  constructor(basketId: string, itemCount: number, totalValue: number, customerId?: string) {
    this.occurredAt = new Date();
    this.aggregateId = basketId;
    this.payload = { basketId, customerId, itemCount, totalValue };
  }
}

export class BasketConvertedToOrderEvent implements DomainEvent {
  readonly eventType = 'basket.converted_to_order';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    basketId: string;
    orderId: string;
    customerId?: string;
    totalValue: number;
  };

  constructor(basketId: string, orderId: string, totalValue: number, customerId?: string) {
    this.occurredAt = new Date();
    this.aggregateId = basketId;
    this.payload = { basketId, orderId, customerId, totalValue };
  }
}

export class BasketMergedEvent implements DomainEvent {
  readonly eventType = 'basket.merged';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    sourceBasketId: string;
    targetBasketId: string;
    itemsMerged: number;
  };

  constructor(sourceBasketId: string, targetBasketId: string, itemsMerged: number) {
    this.occurredAt = new Date();
    this.aggregateId = targetBasketId;
    this.payload = { sourceBasketId, targetBasketId, itemsMerged };
  }
}

export class BasketAssignedToCustomerEvent implements DomainEvent {
  readonly eventType = 'basket.assigned_to_customer';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    basketId: string;
    customerId: string;
    previousSessionId?: string;
  };

  constructor(basketId: string, customerId: string, previousSessionId?: string) {
    this.occurredAt = new Date();
    this.aggregateId = basketId;
    this.payload = { basketId, customerId, previousSessionId };
  }
}
