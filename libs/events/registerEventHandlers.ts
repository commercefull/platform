/**
 * Event Handler Registration
 * 
 * Centralized registration of all event handlers at application boot.
 * This ensures event-driven architecture is properly wired up.
 */

import { eventBus } from './eventBus';

// Track registration state
let isRegistered = false;

/**
 * Register all event handlers on application boot
 * Called from app initialization (server.ts or app.ts)
 */
export function registerAllEventHandlers(): void {
  if (isRegistered) {
    console.log('[EVENTS] Event handlers already registered, skipping...');
    return;
  }

  console.log('[EVENTS] Registering event handlers...');

  // Register handlers from each module
  // Note: Each module exports a register function that sets up its handlers

  try {
    // Order-related handlers (notifications, fulfillment trigger)
    registerOrderEventHandlers();

    // Inventory handlers (stock alerts, reorder triggers)
    registerInventoryEventHandlers();

    // Fulfillment handlers (shipping integration, tracking updates)
    registerFulfillmentEventHandlers();

    // Loyalty handlers (points calculation, tier updates)
    registerLoyaltyEventHandlers();

    // Store handlers (inventory sync, pickup notifications)
    registerStoreEventHandlers();

    // Merchant handlers (settlement updates)
    registerMerchantEventHandlers();

    // Analytics handlers (tracking, reporting)
    registerAnalyticsEventHandlers();

    isRegistered = true;
    console.log('[EVENTS] Event handlers registered successfully');
    console.log(`[EVENTS] Total registered event types: ${eventBus.getRegisteredTypes().length}`);
  } catch (error) {
    console.error('[EVENTS] Failed to register event handlers:', error);
    throw error;
  }
}

/**
 * Unregister all handlers (for testing/shutdown)
 */
export function unregisterAllEventHandlers(): void {
  console.log('[EVENTS] Unregistering all event handlers...');
  isRegistered = false;
  // EventBus doesn't have a clearAll method, so handlers persist
  // This is mainly for tracking registration state
}

/**
 * Check if handlers are registered
 */
export function areHandlersRegistered(): boolean {
  return isRegistered;
}

// ============================================================================
// Module-specific handler registration functions
// These can be expanded as modules implement their event handlers
// ============================================================================

function registerOrderEventHandlers(): void {
  // Order created -> trigger fulfillment creation, send confirmation
  eventBus.registerHandler('order.created', async (payload) => {
    console.log(`[ORDER EVENT] Order created: ${payload.data?.orderId || 'unknown'}`);
    // Fulfillment and notification modules will handle this
  });

  // Order paid -> trigger fulfillment processing
  eventBus.registerHandler('order.paid', async (payload) => {
    console.log(`[ORDER EVENT] Order paid: ${payload.data?.orderId || 'unknown'}`);
  });

  // Order cancelled -> release inventory, cancel fulfillment
  eventBus.registerHandler('order.cancelled', async (payload) => {
    console.log(`[ORDER EVENT] Order cancelled: ${payload.data?.orderId || 'unknown'}`);
  });

  // Order completed -> trigger loyalty points earning
  eventBus.registerHandler('order.completed', async (payload) => {
    console.log(`[ORDER EVENT] Order completed: ${payload.data?.orderId || 'unknown'}`);
  });
}

function registerInventoryEventHandlers(): void {
  // Low stock alert
  eventBus.registerHandler('inventory.low', async (payload) => {
    console.log(`[INVENTORY EVENT] Low stock alert: ${payload.data?.productId || 'unknown'}`);
    // Could trigger reorder, notification, etc.
  });

  // Out of stock
  eventBus.registerHandler('inventory.out_of_stock', async (payload) => {
    console.log(`[INVENTORY EVENT] Out of stock: ${payload.data?.productId || 'unknown'}`);
  });

  // Stock reserved (from order creation)
  eventBus.registerHandler('inventory.reserved', async (payload) => {
    console.log(`[INVENTORY EVENT] Stock reserved: ${payload.data?.quantity || 0} units`);
  });

  // Stock released (from order cancellation)
  eventBus.registerHandler('inventory.released', async (payload) => {
    console.log(`[INVENTORY EVENT] Stock released: ${payload.data?.quantity || 0} units`);
  });
}

function registerFulfillmentEventHandlers(): void {
  // Fulfillment created
  eventBus.registerHandler('fulfillment.created', async (payload) => {
    console.log(`[FULFILLMENT EVENT] Fulfillment created: ${payload.data?.fulfillmentId || 'unknown'}`);
  });

  // Fulfillment shipped -> update order, notify customer
  eventBus.registerHandler('fulfillment.shipped', async (payload) => {
    console.log(`[FULFILLMENT EVENT] Shipped: ${payload.data?.fulfillmentId || 'unknown'}`);
  });

  // Fulfillment delivered -> complete order
  eventBus.registerHandler('fulfillment.delivered', async (payload) => {
    console.log(`[FULFILLMENT EVENT] Delivered: ${payload.data?.fulfillmentId || 'unknown'}`);
  });
}

function registerLoyaltyEventHandlers(): void {
  // Points earned
  eventBus.registerHandler('loyalty.points_earned', async (payload) => {
    console.log(`[LOYALTY EVENT] Points earned: ${payload.data?.points || 0}`);
  });

  // Points redeemed
  eventBus.registerHandler('loyalty.points_redeemed', async (payload) => {
    console.log(`[LOYALTY EVENT] Points redeemed: ${payload.data?.points || 0}`);
  });

  // Tier upgraded
  eventBus.registerHandler('loyalty.tier_upgraded', async (payload) => {
    console.log(`[LOYALTY EVENT] Tier upgraded: ${payload.data?.newTier || 'unknown'}`);
  });
}

function registerStoreEventHandlers(): void {
  // Store created
  eventBus.registerHandler('store.created', async (payload) => {
    console.log(`[STORE EVENT] Store created: ${payload.data?.storeId || 'unknown'}`);
  });

  // Inventory linked to store
  eventBus.registerHandler('store.inventory_linked', async (payload) => {
    console.log(`[STORE EVENT] Inventory linked: ${payload.data?.inventoryId || 'unknown'}`);
  });

  // Pickup configured
  eventBus.registerHandler('store.pickup_configured', async (payload) => {
    console.log(`[STORE EVENT] Pickup configured for store: ${payload.data?.storeId || 'unknown'}`);
  });
}

function registerMerchantEventHandlers(): void {
  // Merchant approved
  eventBus.registerHandler('merchant.approved', async (payload) => {
    console.log(`[MERCHANT EVENT] Merchant approved: ${payload.data?.merchantId || 'unknown'}`);
  });

  // Settlement created
  eventBus.registerHandler('merchant.settlement_created', async (payload) => {
    console.log(`[MERCHANT EVENT] Settlement created: ${payload.data?.settlementId || 'unknown'}`);
  });

  // Payout processed
  eventBus.registerHandler('merchant.payout_processed', async (payload) => {
    console.log(`[MERCHANT EVENT] Payout processed: ${payload.data?.payoutId || 'unknown'}`);
  });
}

function registerAnalyticsEventHandlers(): void {
  // Track all events for analytics (wildcard handler)
  // Note: The eventBus already emits to '*' for all events
  // This is where analytics tracking would be implemented
}
