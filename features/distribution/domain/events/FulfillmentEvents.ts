/**
 * Distribution Domain Events
 * Events that occur during the fulfillment lifecycle
 */

export interface DomainEvent {
  eventType: string;
  occurredAt: Date;
  aggregateId: string;
  aggregateType: string;
  payload: Record<string, any>;
}

// Base event creator
function createEvent(
  eventType: string,
  aggregateId: string,
  aggregateType: string,
  payload: Record<string, any>
): DomainEvent {
  return {
    eventType,
    occurredAt: new Date(),
    aggregateId,
    aggregateType,
    payload
  };
}

// =============================================================================
// Fulfillment Events
// =============================================================================

export const FulfillmentCreated = (fulfillmentId: string, orderId: string, warehouseId?: string) =>
  createEvent('FULFILLMENT_CREATED', fulfillmentId, 'OrderFulfillment', {
    orderId,
    warehouseId
  });

export const FulfillmentWarehouseAssigned = (fulfillmentId: string, warehouseId: string, previousWarehouseId?: string) =>
  createEvent('FULFILLMENT_WAREHOUSE_ASSIGNED', fulfillmentId, 'OrderFulfillment', {
    warehouseId,
    previousWarehouseId
  });

export const FulfillmentProcessingStarted = (fulfillmentId: string, orderId: string) =>
  createEvent('FULFILLMENT_PROCESSING_STARTED', fulfillmentId, 'OrderFulfillment', {
    orderId
  });

export const FulfillmentPickingStarted = (fulfillmentId: string, pickedBy?: string) =>
  createEvent('FULFILLMENT_PICKING_STARTED', fulfillmentId, 'OrderFulfillment', {
    pickedBy
  });

export const FulfillmentPickingCompleted = (fulfillmentId: string) =>
  createEvent('FULFILLMENT_PICKING_COMPLETED', fulfillmentId, 'OrderFulfillment', {});

export const FulfillmentPackingCompleted = (fulfillmentId: string, packageCount: number) =>
  createEvent('FULFILLMENT_PACKING_COMPLETED', fulfillmentId, 'OrderFulfillment', {
    packageCount
  });

export const FulfillmentShipped = (
  fulfillmentId: string,
  orderId: string,
  trackingNumber: string,
  carrierId?: string
) =>
  createEvent('FULFILLMENT_SHIPPED', fulfillmentId, 'OrderFulfillment', {
    orderId,
    trackingNumber,
    carrierId
  });

export const FulfillmentInTransit = (fulfillmentId: string, location?: string) =>
  createEvent('FULFILLMENT_IN_TRANSIT', fulfillmentId, 'OrderFulfillment', {
    location
  });

export const FulfillmentOutForDelivery = (fulfillmentId: string) =>
  createEvent('FULFILLMENT_OUT_FOR_DELIVERY', fulfillmentId, 'OrderFulfillment', {});

export const FulfillmentDelivered = (
  fulfillmentId: string,
  orderId: string,
  deliveredAt: Date
) =>
  createEvent('FULFILLMENT_DELIVERED', fulfillmentId, 'OrderFulfillment', {
    orderId,
    deliveredAt: deliveredAt.toISOString()
  });

export const FulfillmentFailed = (fulfillmentId: string, reason: string) =>
  createEvent('FULFILLMENT_FAILED', fulfillmentId, 'OrderFulfillment', {
    reason
  });

export const FulfillmentReturned = (fulfillmentId: string, reason?: string) =>
  createEvent('FULFILLMENT_RETURNED', fulfillmentId, 'OrderFulfillment', {
    reason
  });

export const FulfillmentCancelled = (fulfillmentId: string, orderId: string, reason?: string) =>
  createEvent('FULFILLMENT_CANCELLED', fulfillmentId, 'OrderFulfillment', {
    orderId,
    reason
  });

// =============================================================================
// Shipping Events
// =============================================================================

export const ShippingRateCalculated = (
  orderId: string,
  zoneId: string,
  methodId: string,
  rate: number,
  currency: string
) =>
  createEvent('SHIPPING_RATE_CALCULATED', orderId, 'Order', {
    zoneId,
    methodId,
    rate,
    currency
  });

export const ShippingMethodSelected = (
  orderId: string,
  methodId: string,
  methodName: string,
  rate: number
) =>
  createEvent('SHIPPING_METHOD_SELECTED', orderId, 'Order', {
    methodId,
    methodName,
    rate
  });

// =============================================================================
// Warehouse Events
// =============================================================================

export const WarehouseActivated = (warehouseId: string, name: string) =>
  createEvent('WAREHOUSE_ACTIVATED', warehouseId, 'Warehouse', {
    name
  });

export const WarehouseDeactivated = (warehouseId: string, name: string) =>
  createEvent('WAREHOUSE_DEACTIVATED', warehouseId, 'Warehouse', {
    name
  });

export const WarehouseSetAsDefault = (warehouseId: string, previousDefaultId?: string) =>
  createEvent('WAREHOUSE_SET_AS_DEFAULT', warehouseId, 'Warehouse', {
    previousDefaultId
  });

// =============================================================================
// Event Dispatcher Interface
// =============================================================================

export interface EventDispatcher {
  dispatch(event: DomainEvent): Promise<void>;
  dispatchAll(events: DomainEvent[]): Promise<void>;
}

// Simple in-memory event dispatcher for now
export class InMemoryEventDispatcher implements EventDispatcher {
  private handlers: Map<string, ((event: DomainEvent) => Promise<void>)[]> = new Map();

  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  async dispatch(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    await Promise.all(handlers.map(handler => handler(event)));
    
    // Also dispatch to wildcard handlers
    const wildcardHandlers = this.handlers.get('*') || [];
    await Promise.all(wildcardHandlers.map(handler => handler(event)));
  }

  async dispatchAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.dispatch(event);
    }
  }
}

// Singleton instance
export const eventDispatcher = new InMemoryEventDispatcher();
