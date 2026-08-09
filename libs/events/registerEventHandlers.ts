/**
 * Event Handler Registration
 *
 * Centralized registration of all event handlers at application boot.
 * This ensures event-driven architecture is properly wired up.
 */

import { eventBus } from './eventBus';
import { WebhookDispatchService } from '../../modules/webhook/application/services/WebhookDispatchService';
import WebhookRepo from '../../modules/webhook/infrastructure/repositories/WebhookRepository';
import OrderRepo from '../../modules/order/infrastructure/repositories/OrderRepository';
import * as inventoryReservationRepo from '../../modules/inventory/infrastructure/repositories/inventoryReservationRepo';
import InventoryRepo from '../../modules/inventory/infrastructure/repositories/inventoryRepo';
import WarehouseRepo from '../../modules/warehouse/infrastructure/repositories/warehouseRepo';
import fulfillmentRepository from '../../modules/fulfillment/infrastructure/repositories/FulfillmentRepository';
import { CreateFulfillmentUseCase } from '../../modules/fulfillment/application/useCases/CreateFulfillment';
import { logger } from '../logger';

// Track registration state
let isRegistered = false;
let webhookDispatchService: WebhookDispatchService | null = null;

/**
 * Register all event handlers on application boot
 * Called from app initialization (server.ts or app.ts)
 */
export function registerAllEventHandlers(): void {
  if (isRegistered) {
    return;
  }

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

    // Webhook dispatch (forwards eventBus events to registered webhook endpoints)
    registerWebhookDispatch();

    isRegistered = true;

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
  if (webhookDispatchService) {
    webhookDispatchService.stop();
    webhookDispatchService = null;
  }
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
  // Order created -> reserve inventory atomically
  eventBus.registerHandler('order.created', async payload => {
    const eventData = payload.data as Record<string, unknown>;
    const orderId = eventData.orderId as string;
    if (!orderId) return;

    try {
      const order = await OrderRepo.findById(orderId);
      if (!order) return;

      for (const item of order.items) {
        try {
          const availability = await InventoryRepo.checkProductAvailability(item.productId, item.productVariantId, item.quantity);

          if (availability.available && availability.locations.length > 0) {
            const loc = availability.locations[0] as Record<string, unknown>;
            const locationId: string = (loc.locationId as string) || (loc.inventoryLocationId as string) || '';
            if (!locationId) continue;

            const reservation = await inventoryReservationRepo.createAtomic({
              orderId,
              productVariantId: item.productVariantId || item.productId,
              locationId,
              quantity: item.quantity,
              expiresAt: new Date(Date.now() + 30 * 60 * 1000),
            });

            if (!reservation) {
              eventBus.emit('inventory.reservation_failed', {
                orderId,
                productId: item.productId,
                productVariantId: item.productVariantId,
                requested: item.quantity,
                reason: 'insufficient_stock',
              });
            }
          } else {
            eventBus.emit('inventory.reservation_failed', {
              orderId,
              productId: item.productId,
              productVariantId: item.productVariantId,
              requested: item.quantity,
              reason: 'no_location',
            });
          }
        } catch (itemErr: unknown) {
          logger.warn(`inventory reservation failed for item ${item.productId}: ${(itemErr as Error).message}`);
          eventBus.emit('inventory.reservation_failed', {
            orderId,
            productId: item.productId,
            productVariantId: item.productVariantId,
            requested: item.quantity,
            reason: 'error',
          });
        }
      }
    } catch (err: unknown) {
      logger.error(`order.created inventory handler error: ${(err as Error).message}`);
    }
  });

  // Order paid -> auto-create fulfillment from default warehouse
  eventBus.registerHandler('order.paid', async payload => {
    const eventData = payload.data as Record<string, unknown>;
    const orderId = eventData.orderId as string;
    if (!orderId) return;

    try {
      const order = await OrderRepo.findById(orderId);
      if (!order) {
        logger.warn(`order.paid: order ${orderId} not found`);
        return;
      }

      // Skip if order has no physical items (all digital)
      const physicalItems = order.items.filter(item => !item.isDigital);
      if (physicalItems.length === 0) {
        logger.info(`order.paid: order ${orderId} has only digital items, skipping fulfillment`);
        return;
      }

      // Map order items to fulfillment items
      const fulfillmentItems = physicalItems.map(item => ({
        orderItemId: item.orderItemId,
        productId: item.productId,
        variantId: item.productVariantId,
        sku: item.sku,
        name: item.name,
        quantityOrdered: item.quantity,
      }));

      // Check if this is a pickup order (BOPIS)
      const orderMetadata = order.metadata || {};
      if (orderMetadata.fulfillmentType === 'pickup' && orderMetadata.pickupLocationId) {
        const pickupLocationId = orderMetadata.pickupLocationId as string;
        const pickupLocationName = (orderMetadata.pickupLocationName as string) || 'Pickup Location';
        const pickupStoreId = orderMetadata.pickupStoreId as string | undefined;
        const pickupAddr = (orderMetadata.pickupAddress || {}) as Record<string, string>;

        const pickupAddress = {
          addressLine1: pickupAddr.line1 || '',
          addressLine2: pickupAddr.line2,
          city: pickupAddr.city || '',
          state: pickupAddr.state,
          postalCode: pickupAddr.postalCode || '',
          countryCode: pickupAddr.country || '',
        };

        const createFulfillmentUseCase = new CreateFulfillmentUseCase(fulfillmentRepository);
        const result = await createFulfillmentUseCase.execute({
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          sourceType: 'store' as const,
          sourceId: pickupStoreId || pickupLocationId,
          shipFromAddress: pickupAddress,
          shipToAddress: pickupAddress,
          items: fulfillmentItems,
          notes: `Pickup at: ${pickupLocationName}${orderMetadata.pickupInstructions ? ` — ${orderMetadata.pickupInstructions}` : ''}`,
        });

        // Consume inventory reservations
        await inventoryReservationRepo.consumeByOrder(orderId);

        // Emit ready-for-pickup notification
        eventBus.emit('order.ready_for_pickup', {
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          pickupLocationId,
          pickupLocationName,
          pickupStoreId,
          customerEmail: order.customerEmail,
          customerId: order.customerId,
        });

        logger.info(`order.paid: pickup fulfillment ${result.fulfillment.fulfillmentId} created for order ${orderId} at ${pickupLocationName}`);
        return;
      }

      // Standard shipping fulfillment flow
      // Find default warehouse for ship-from address
      const warehouse = await WarehouseRepo.findDefault();
      if (!warehouse) {
        logger.warn(`order.paid: no default warehouse found for order ${orderId}, fulfillment must be created manually`);
        return;
      }

      // Map order shipping address to fulfillment address
      const sa = order.shippingAddress;
      if (!sa) {
        logger.warn(`order.paid: order ${orderId} has no shipping address, skipping fulfillment`);
        return;
      }

      const shipToAddress = {
        firstName: sa.firstName,
        lastName: sa.lastName,
        company: sa.company,
        addressLine1: sa.address1,
        addressLine2: sa.address2,
        city: sa.city,
        state: sa.state,
        postalCode: sa.postalCode,
        countryCode: sa.countryCode || sa.country,
        phone: sa.phone,
        email: sa.email,
      };

      const shipFromAddress = {
        firstName: warehouse.name || 'Warehouse',
        lastName: '',
        addressLine1: warehouse.addressLine1 || '',
        addressLine2: warehouse.addressLine2 || undefined,
        city: warehouse.city || '',
        state: warehouse.state || '',
        postalCode: warehouse.postalCode || '',
        countryCode: warehouse.country || '',
        phone: warehouse.phone || undefined,
        email: warehouse.email || undefined,
      };

      // Create fulfillment
      const createFulfillmentUseCase = new CreateFulfillmentUseCase(fulfillmentRepository);
      const result = await createFulfillmentUseCase.execute({
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        sourceType: 'warehouse' as const,
        sourceId: warehouse.distributionWarehouseId,
        shipFromAddress,
        shipToAddress,
        items: fulfillmentItems,
      });

      // Consume inventory reservations (mark as consumed so they aren't released)
      await inventoryReservationRepo.consumeByOrder(orderId);

      logger.info(`order.paid: fulfillment ${result.fulfillment.fulfillmentId} created for order ${orderId}`);
    } catch (err: unknown) {
      logger.error(`order.paid fulfillment handler error: ${(err as Error).message}`);
    }
  });

  // Order cancelled -> release inventory reservations
  eventBus.registerHandler('order.cancelled', async payload => {
    const eventData = payload.data as Record<string, unknown>;
    const orderId = eventData.orderId as string;
    if (!orderId) return;
    try {
      await inventoryReservationRepo.releaseByOrder(orderId);
    } catch (err: unknown) {
      logger.error(`order.cancelled inventory release error: ${(err as Error).message}`);
    }
  });

  // Order payment failed -> release inventory reservations
  eventBus.registerHandler('order.payment_failed', async payload => {
    const eventData = payload.data as Record<string, unknown>;
    const orderId = eventData.orderId as string;
    if (!orderId) return;
    try {
      await inventoryReservationRepo.releaseByOrder(orderId);
    } catch (err: unknown) {
      logger.error(`order.payment_failed inventory release error: ${(err as Error).message}`);
    }
  });

  // Order completed -> trigger loyalty points earning
  eventBus.registerHandler('order.completed', async _payload => {});
}

function registerInventoryEventHandlers(): void {
  // Low stock alert
  eventBus.registerHandler('inventory.low', async _payload => {
    // Could trigger reorder, notification, etc.
  });

  // Out of stock
  eventBus.registerHandler('inventory.out_of_stock', async _payload => {});

  // Stock reserved (from order creation)
  eventBus.registerHandler('inventory.reserved', async _payload => {});

  // Stock released (from order cancellation)
  eventBus.registerHandler('inventory.released', async _payload => {});
}

function registerFulfillmentEventHandlers(): void {
  // Fulfillment created
  eventBus.registerHandler('fulfillment.created', async _payload => {});

  // Fulfillment shipped -> update order, notify customer
  eventBus.registerHandler('fulfillment.shipped', async _payload => {});

  // Fulfillment delivered -> complete order
  eventBus.registerHandler('fulfillment.delivered', async _payload => {});
}

function registerLoyaltyEventHandlers(): void {
  // Points earned
  eventBus.registerHandler('loyalty.points_earned', async _payload => {});

  // Points redeemed
  eventBus.registerHandler('loyalty.points_redeemed', async _payload => {});

  // Tier upgraded
  eventBus.registerHandler('loyalty.tier_upgraded', async _payload => {});
}

function registerStoreEventHandlers(): void {
  // Store created
  eventBus.registerHandler('store.created', async _payload => {});

  // Inventory linked to store
  eventBus.registerHandler('store.inventory_linked', async _payload => {});

  // Pickup configured
  eventBus.registerHandler('store.pickup_configured', async _payload => {});
}

function registerMerchantEventHandlers(): void {
  // Merchant approved
  eventBus.registerHandler('merchant.approved', async _payload => {});

  // Settlement created
  eventBus.registerHandler('merchant.settlement_created', async _payload => {});

  // Payout processed
  eventBus.registerHandler('merchant.payout_processed', async _payload => {});
}

function registerAnalyticsEventHandlers(): void {
  // Track all events for analytics (wildcard handler)
  // Note: The eventBus already emits to '*' for all events
  // This is where analytics tracking would be implemented
}

function registerWebhookDispatch(): void {
  webhookDispatchService = new WebhookDispatchService(WebhookRepo);
  webhookDispatchService.start();
}
