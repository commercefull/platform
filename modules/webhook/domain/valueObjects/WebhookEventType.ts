/**
 * Webhook Event Type Value Object
 *
 * Defines the event types that can trigger webhook deliveries.
 * These map to the platform's EventType from the eventBus.
 */

export const WebhookEventCategory = {
  PRODUCT: 'product',
  ORDER: 'order',
  INVENTORY: 'inventory',
  CUSTOMER: 'customer',
  PAYMENT: 'payment',
  FULFILLMENT: 'fulfillment',
} as const;

export type WebhookEventCategoryType = (typeof WebhookEventCategory)[keyof typeof WebhookEventCategory];

/**
 * Events relevant for POS / external system sync
 */
export const SYNC_RELEVANT_EVENTS = [
  // Product events
  'product.created',
  'product.updated',
  'product.deleted',
  'product.published',
  'product.unpublished',
  'product.price_changed',
  'product.variant_created',
  'product.variant_updated',
  'product.variant_deleted',
  'product.category_changed',
  // Order events
  'order.created',
  'order.paid',
  'order.shipped',
  'order.completed',
  'order.cancelled',
  'order.refunded',
  'order.status_changed',
  // Inventory events
  'inventory.low',
  'inventory.out_of_stock',
  'inventory.reserved',
  'inventory.released',
  // Customer events
  'customer.created',
  'customer.updated',
  'customer.registered',
  // Payment events
  'payment.received',
  'payment.refunded',
  // Fulfillment events
  'fulfillment.shipped',
  'fulfillment.delivered',
  'fulfillment.cancelled',
] as const;

export type SyncRelevantEvent = (typeof SYNC_RELEVANT_EVENTS)[number];

/**
 * Get the category of an event type
 */
export function getEventCategory(eventType: string): WebhookEventCategoryType | null {
  const prefix = eventType.split('.')[0];
  const map: Record<string, WebhookEventCategoryType> = {
    product: WebhookEventCategory.PRODUCT,
    order: WebhookEventCategory.ORDER,
    inventory: WebhookEventCategory.INVENTORY,
    customer: WebhookEventCategory.CUSTOMER,
    payment: WebhookEventCategory.PAYMENT,
    fulfillment: WebhookEventCategory.FULFILLMENT,
  };
  return map[prefix] || null;
}
