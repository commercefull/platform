/**
 * Event Handler Registration
 *
 * Centralized registration of all event handlers at application boot.
 * This ensures event-driven architecture is properly wired up.
 */

import { eventBus } from './eventBus';
import { WebhookDispatchService } from '../../modules/webhook/application/services/WebhookDispatchService';
import { WebhookRepository as WebhookRepo } from '../../modules/webhook/infrastructure';
import { OrderDataRepository as OrderDataRepo } from '../../modules/order/infrastructure';

const OrderRepo = OrderDataRepo.commands;
import { InventoryDataRepository as InventoryDataRepo } from '../../modules/inventory/infrastructure';
import { WarehouseDataRepository as WarehouseDataRepo } from '../../modules/warehouse/infrastructure';
import { FulfillmentDataRepository as FulfillmentDataRepo } from '../../modules/fulfillment/infrastructure';

const inventoryReservationRepo = InventoryDataRepo.reservations;
const InventoryRepo = InventoryDataRepo.stock;
const WarehouseRepo = WarehouseDataRepo.warehouses;
const fulfillmentRepository = FulfillmentDataRepo.fulfillments;
import { CreateFulfillmentUseCase } from '../../modules/fulfillment/application/useCases/CreateFulfillment';
import { OrderRouter } from '../../modules/order/domain/services/OrderRouter';
import { StoreDataRepository as StoreDataRepo } from '../../modules/store/infrastructure';

const StoreRepo = StoreDataRepo.stores;
import { JobScheduler } from '../jobs/cronScheduler';
import { LoyaltyDataRepository as LoyaltyDataRepo } from '../../modules/loyalty/infrastructure';

const LoyaltyRepo = LoyaltyDataRepo.points;
import { query } from '../db';
import { logger } from '../logger';
import { stopOutboxDispatcher } from './outboxDispatcher';
import { registerCheckoutEventHandlers } from '../../modules/checkout/application/eventHandlers';
import { CheckoutRepository as CheckoutRepo } from '../../modules/checkout/infrastructure';
import { registerOrderPaymentEventHandlers } from '../../modules/order/application/eventHandlers';
import { registerTrackingEventHandlers, setConsentRepository } from '../../modules/tracking/application/eventHandlers/trackingEventHandlers';
import { moduleRegistry } from '../../boot/moduleManifests';
import { GdprDataRepository } from '../../modules/gdpr/infrastructure';
import { integrationRepo, credentialRepo, subscriptionRepo, logRepo } from '../../modules/integration/application/useCases/wired';
import { IntegrationEventDispatcher } from '../../modules/integration/application/services/IntegrationEventDispatcher';

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
    if (moduleRegistry.shouldRegisterEvents('order')) {
      registerOrderEventHandlers();
    }

    // Order payment event handlers (Published Language: reacts to payment events)
    if (moduleRegistry.shouldRegisterEvents('order')) {
      registerOrderPaymentEventHandlers();
    }

    // Inventory handlers (stock alerts, reorder triggers)
    if (moduleRegistry.shouldRegisterEvents('inventory')) {
      registerInventoryEventHandlers();
    }

    // Fulfillment handlers (shipping integration, tracking updates)
    if (moduleRegistry.shouldRegisterEvents('fulfillment')) {
      registerFulfillmentEventHandlers();
    }

    // Loyalty handlers (points calculation, tier updates)
    if (moduleRegistry.shouldRegisterEvents('loyalty')) {
      registerLoyaltyEventHandlers();
    }

    // Store handlers (inventory sync, pickup notifications)
    if (moduleRegistry.shouldRegisterEvents('store')) {
      registerStoreEventHandlers();
    }

    // Merchant handlers (settlement updates)
    if (moduleRegistry.shouldRegisterEvents('organization')) {
      registerMerchantEventHandlers();
    }

    // Analytics handlers (tracking, reporting)
    if (moduleRegistry.shouldRegisterEvents('analytics')) {
      registerAnalyticsEventHandlers();
    }

    // Basket handlers (cart recovery)
    if (moduleRegistry.shouldRegisterEvents('basket')) {
      registerBasketEventHandlers();
    }

    // Checkout handlers (Published Language: reacts to payment events)
    if (moduleRegistry.shouldRegisterEvents('checkout')) {
      registerCheckoutEventHandlers(CheckoutRepo);
    }

    // Payment handlers (order status, notifications)
    if (moduleRegistry.shouldRegisterEvents('payment')) {
      registerPaymentEventHandlers();
    }

    // Customer handlers (welcome email)
    if (moduleRegistry.shouldRegisterEvents('customer')) {
      registerCustomerEventHandlers();
    }

    // Product handlers (search index, cache invalidation)
    if (moduleRegistry.shouldRegisterEvents('product')) {
      registerProductEventHandlers();
    }

    // Subscription handlers (notifications, analytics)
    if (moduleRegistry.shouldRegisterEvents('subscription')) {
      registerSubscriptionEventHandlers();
    }

    // Webhook dispatch (forwards eventBus events to registered webhook endpoints)
    if (moduleRegistry.shouldRegisterEvents('webhook')) {
      registerWebhookDispatch();
    }

    // Tracking handlers (server-side GTM + Meta CAPI, consent-gated)
    if (moduleRegistry.shouldRegisterEvents('tracking')) {
      // Wire consent repository from GDPR module for consent gating
      if (moduleRegistry.isEnabled('gdpr')) {
        setConsentRepository(GdprDataRepository.cookieConsent);
      }
      registerTrackingEventHandlers();
    }

    // Integration dispatcher (forwards events to third-party integrations)
    if (moduleRegistry.shouldRegisterEvents('integration')) {
      registerIntegrationDispatcher();
    }

    isRegistered = true;

    logger.info('Event handlers registered', { registeredTypes: eventBus.getRegisteredTypes().length });
  } catch (error) {
    logger.error('Failed to register event handlers', { error });
    throw error;
  }
}

/**
 * Unregister all handlers (for testing/shutdown)
 */
export async function unregisterAllEventHandlers(): Promise<void> {
  if (webhookDispatchService) {
    webhookDispatchService.stop();
    webhookDispatchService = null;
  }
  // Stop the outbox dispatcher
  await stopOutboxDispatcher();
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
              productId: item.productId,
              variantId: item.productVariantId || undefined,
              inventoryItemId: (loc.inventoryItemId as string) || (loc.inventoryLevelId as string) || locationId,
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
          logger.warning(`inventory reservation failed for item ${item.productId}: ${(itemErr as Error).message}`);
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
        logger.warning(`order.paid: order ${orderId} not found`);
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
      // Try intelligent routing via OrderRouter first, fall back to default warehouse
      const sa = order.shippingAddress;
      if (!sa) {
        logger.warning(`order.paid: order ${orderId} has no shipping address, skipping fulfillment`);
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

      // Attempt to find a store with inventory via OrderRouter
      let fulfillmentSourceType: 'warehouse' | 'store' = 'warehouse';
      let fulfillmentSourceId = '';
      let shipFromAddress: Record<string, unknown>;

      try {
        const stores = await StoreRepo.findActive();
        const orderRouter = new OrderRouter(
          { findById: async (id: string) => { const s = stores.find(s => s.storeId === id); return s ? { storeId: s.storeId, name: s.name, canFulfillOnline: s.settings?.allowGuestCheckout ?? true, canPickupInStore: s.settings?.pickup?.enabled ?? false, localDeliveryEnabled: s.settings?.localDelivery?.enabled ?? false } : null; } },
          {
            getAvailableQuantity: async (_storeId: string, productId: string, variantId?: string) => {
              const avail = await InventoryRepo.checkProductAvailability(productId, variantId, 1);
              return avail.totalAvailable;
            },
          },
        );

        const routingResult = await orderRouter.determineFulfillmentStore(
          {
            orderId: order.orderId,
            fulfillmentType: 'shipping',
            items: physicalItems.map(item => ({
              productId: item.productId,
              variantId: item.productVariantId,
              quantity: item.quantity,
            })),
          },
          stores.map(s => ({
            storeId: s.storeId,
            name: s.name,
            latitude: s.address?.latitude,
            longitude: s.address?.longitude,
            canFulfillOnline: s.settings?.allowGuestCheckout ?? true,
            canPickupInStore: s.settings?.pickup?.enabled ?? false,
            localDeliveryEnabled: s.settings?.localDelivery?.enabled ?? false,
            priority: 0,
          })),
        );

        const selectedStore = stores.find(s => s.storeId === routingResult.storeId);
        if (selectedStore && selectedStore.address) {
          fulfillmentSourceType = 'store';
          fulfillmentSourceId = selectedStore.storeId;
          shipFromAddress = {
            firstName: selectedStore.name,
            lastName: '',
            addressLine1: selectedStore.address.line1,
            addressLine2: selectedStore.address.line2,
            city: selectedStore.address.city,
            state: selectedStore.address.state,
            postalCode: selectedStore.address.postalCode,
            countryCode: selectedStore.address.country,
          };
          logger.info(`order.paid: OrderRouter selected store ${selectedStore.name} for order ${orderId}: ${routingResult.reason}`);
        } else {
          throw new Error('No store found by router');
        }
      } catch (routeErr: unknown) {
        // Fall back to default warehouse
        logger.info(`order.paid: OrderRouter fallback to warehouse for order ${orderId}: ${(routeErr as Error).message}`);
        const warehouse = await WarehouseRepo.findDefault();
        if (!warehouse) {
          logger.warning(`order.paid: no default warehouse found for order ${orderId}, fulfillment must be created manually`);
          return;
        }
        fulfillmentSourceId = warehouse.distributionWarehouseId;
        shipFromAddress = {
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
      }

      // Create fulfillment
      const createFulfillmentUseCase = new CreateFulfillmentUseCase(fulfillmentRepository);
      const result = await createFulfillmentUseCase.execute({
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        sourceType: fulfillmentSourceType,
        sourceId: fulfillmentSourceId,
        shipFromAddress: shipFromAddress as { addressLine1: string; city: string; postalCode: string; countryCode: string; firstName?: string; lastName?: string; company?: string; addressLine2?: string; state?: string; phone?: string; email?: string },
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
  eventBus.registerHandler('order.completed', async payload => {
    const eventData = payload.data as Record<string, unknown>;
    const orderId = eventData.orderId as string;
    const customerId = eventData.customerId as string;
    if (!orderId || !customerId) return;

    try {
      const order = await OrderRepo.findById(orderId);
      if (!order) return;

      // Award loyalty points based on order total
      const orderTotal = order.totalAmount?.amount ?? 0;
      if (orderTotal > 0) {
        await LoyaltyRepo.processOrderPoints(customerId, orderId, orderTotal);
        logger.info(`order.completed: awarded loyalty points for order ${orderId} to customer ${customerId}`);
      }

      // Send completion notification
      await JobScheduler.scheduleNotification({
        userId: customerId,
        type: 'order_completed',
        title: 'Order Delivered',
        message: `Your order ${order.orderNumber} has been delivered successfully.`,
        data: { orderId, orderNumber: order.orderNumber },
      });
    } catch (err: unknown) {
      logger.error(`order.completed handler error: ${(err as Error).message}`);
    }
  });
}

function registerInventoryEventHandlers(): void {
  // Low stock alert -> notify merchant
  eventBus.registerHandler('inventory.low', async payload => {
    const data = payload.data as Record<string, unknown>;
    const productId = data.productId as string;
    const sku = data.sku as string;
    const currentStock = data.currentStock as number;
    const reorderPoint = data.reorderPoint as number;
    if (!productId) return;

    try {
      // Find merchants who carry this product
      const merchants = await query<Array<{ organizationId: string }>>(
        'SELECT DISTINCT m."organizationId", m."organizationId" FROM merchant m JOIN product p ON p."organizationId" = m."organizationId" WHERE p."productId" = $1 AND m.status = \'active\'',
        [productId],
      );

      for (const merchant of merchants || []) {
        await JobScheduler.scheduleNotification({
          userId: merchant.organizationId,
          type: 'low_stock_alert',
          title: 'Low Stock Alert',
          message: `Product ${sku || productId} is running low (${currentStock} remaining, reorder at ${reorderPoint}).`,
          data: { productId, sku, currentStock, reorderPoint },
        });
      }

      logger.info(`inventory.low: alerted ${merchants?.length || 0} merchants for product ${sku || productId}`);
    } catch (err: unknown) {
      logger.error(`inventory.low handler error: ${(err as Error).message}`);
    }
  });

  // Out of stock -> notify merchant, update product visibility
  eventBus.registerHandler('inventory.out_of_stock', async payload => {
    const data = payload.data as Record<string, unknown>;
    const productId = data.productId as string;
    const sku = data.sku as string;
    if (!productId) return;

    try {
      const merchants = await query<Array<{ organizationId: string }>>(
        'SELECT DISTINCT m."organizationId" FROM merchant m JOIN product p ON p."organizationId" = m."organizationId" WHERE p."productId" = $1 AND m.status = \'active\'',
        [productId],
      );

      for (const merchant of merchants || []) {
        await JobScheduler.scheduleNotification({
          userId: merchant.organizationId,
          type: 'out_of_stock_alert',
          title: 'Out of Stock Alert',
          message: `Product ${sku || productId} is now out of stock.`,
          data: { productId, sku },
        });
      }

      logger.info(`inventory.out_of_stock: alerted ${merchants?.length || 0} merchants for product ${sku || productId}`);
    } catch (err: unknown) {
      logger.error(`inventory.out_of_stock handler error: ${(err as Error).message}`);
    }
  });

  // Stock reserved -> log for audit trail
  eventBus.registerHandler('inventory.reserved', async payload => {
    const data = payload.data as Record<string, unknown>;
    logger.info(`inventory.reserved: product=${data.productId}, qty=${data.quantity}, order=${data.orderId}`);
  });

  // Stock released -> log for audit trail
  eventBus.registerHandler('inventory.released', async payload => {
    const data = payload.data as Record<string, unknown>;
    logger.info(`inventory.released: product=${data.productId}, qty=${data.quantity}, reason=${data.reason}`);
  });
}

function registerFulfillmentEventHandlers(): void {
  // Fulfillment created -> notify customer
  eventBus.registerHandler('fulfillment.created', async payload => {
    const data = payload.data as Record<string, unknown>;
    const orderId = data.orderId as string;
    const customerId = data.customerId as string;
    const fulfillmentId = data.fulfillmentId as string;
    if (!orderId || !customerId) return;

    try {
      const order = await OrderRepo.findById(orderId);
      if (!order) return;

      await JobScheduler.scheduleNotification({
        userId: customerId,
        type: 'fulfillment_created',
        title: 'Order Being Prepared',
        message: `Your order ${order.orderNumber} is being prepared for shipment.`,
        data: { orderId, orderNumber: order.orderNumber, fulfillmentId },
      });

      logger.info(`fulfillment.created: notified customer ${customerId} for fulfillment ${fulfillmentId}`);
    } catch (err: unknown) {
      logger.error(`fulfillment.created handler error: ${(err as Error).message}`);
    }
  });

  // Fulfillment shipped -> update order status, notify customer with tracking
  eventBus.registerHandler('fulfillment.shipped', async payload => {
    const data = payload.data as Record<string, unknown>;
    const orderId = data.orderId as string;
    const customerId = data.customerId as string;
    const trackingNumber = data.trackingNumber as string;
    const carrier = data.carrier as string;
    if (!orderId) return;

    try {
      // Update order status to shipped
      await query('UPDATE "order" SET status = \'shipped\', "updatedAt" = now() WHERE "orderId" = $1', [orderId]);
      await query('INSERT INTO "orderStatusHistory" ("orderId", status, "createdAt") VALUES ($1, \'shipped\', now())', [orderId]);

      // Notify customer
      if (customerId) {
        const order = await OrderRepo.findById(orderId);
        await JobScheduler.scheduleNotification({
          userId: customerId,
          type: 'order_shipped',
          title: 'Order Shipped',
          message: `Your order ${order?.orderNumber || orderId} has been shipped${trackingNumber ? ` via ${carrier || 'carrier'} (tracking: ${trackingNumber})` : ''}.`,
          data: { orderId, orderNumber: order?.orderNumber, trackingNumber, carrier },
          channels: ['email', 'push', 'in_app'],
        });
      }

      logger.info(`fulfillment.shipped: order ${orderId} marked shipped${trackingNumber ? `, tracking=${trackingNumber}` : ''}`);
    } catch (err: unknown) {
      logger.error(`fulfillment.shipped handler error: ${(err as Error).message}`);
    }
  });

  // Fulfillment delivered -> update order status, notify customer, emit order.completed
  eventBus.registerHandler('fulfillment.delivered', async payload => {
    const data = payload.data as Record<string, unknown>;
    const orderId = data.orderId as string;
    const customerId = data.customerId as string;
    if (!orderId) return;

    try {
      // Update order status to delivered
      await query('UPDATE "order" SET status = \'delivered\', "updatedAt" = now() WHERE "orderId" = $1', [orderId]);
      await query('INSERT INTO "orderStatusHistory" ("orderId", status, "createdAt") VALUES ($1, \'delivered\', now())', [orderId]);

      // Notify customer
      if (customerId) {
        const order = await OrderRepo.findById(orderId);
        await JobScheduler.scheduleNotification({
          userId: customerId,
          type: 'order_delivered',
          title: 'Order Delivered',
          message: `Your order ${order?.orderNumber || orderId} has been delivered.`,
          data: { orderId, orderNumber: order?.orderNumber },
        });
      }

      // Emit order.completed for loyalty points and analytics
      eventBus.emit('order.completed', { orderId, customerId, orderNumber: (await OrderRepo.findById(orderId))?.orderNumber });

      logger.info(`fulfillment.delivered: order ${orderId} marked delivered, emitted order.completed`);
    } catch (err: unknown) {
      logger.error(`fulfillment.delivered handler error: ${(err as Error).message}`);
    }
  });
}

function registerLoyaltyEventHandlers(): void {
  // Points earned -> notify customer
  eventBus.registerHandler('loyalty.points_earned', async payload => {
    const data = payload.data as Record<string, unknown>;
    const customerId = data.customerId as string;
    const points = data.points as number;
    if (!customerId) return;

    try {
      await JobScheduler.scheduleNotification({
        userId: customerId,
        type: 'loyalty_points_earned',
        title: 'Points Earned!',
        message: `You earned ${points} loyalty points!`,
        data: { customerId, points },
      });
      logger.info(`loyalty.points_earned: ${points} points for customer ${customerId}`);
    } catch (err: unknown) {
      logger.error(`loyalty.points_earned handler error: ${(err as Error).message}`);
    }
  });

  // Points redeemed -> notify customer
  eventBus.registerHandler('loyalty.points_redeemed', async payload => {
    const data = payload.data as Record<string, unknown>;
    const customerId = data.customerId as string;
    const points = data.points as number;
    if (!customerId) return;

    try {
      await JobScheduler.scheduleNotification({
        userId: customerId,
        type: 'loyalty_points_redeemed',
        title: 'Points Redeemed',
        message: `You redeemed ${points} loyalty points.`,
        data: { customerId, points },
      });
      logger.info(`loyalty.points_redeemed: ${points} points by customer ${customerId}`);
    } catch (err: unknown) {
      logger.error(`loyalty.points_redeemed handler error: ${(err as Error).message}`);
    }
  });

  // Tier upgraded -> notify customer with benefits
  eventBus.registerHandler('loyalty.tier_upgraded', async payload => {
    const data = payload.data as Record<string, unknown>;
    const customerId = data.customerId as string;
    const newTier = data.newTier as string;
    if (!customerId) return;

    try {
      await JobScheduler.scheduleNotification({
        userId: customerId,
        type: 'loyalty_tier_upgraded',
        title: 'Tier Upgraded!',
        message: `Congratulations! You've been upgraded to ${newTier} tier.`,
        data: { customerId, newTier },
        channels: ['email', 'push', 'in_app'],
      });
      logger.info(`loyalty.tier_upgraded: customer ${customerId} upgraded to ${newTier}`);
    } catch (err: unknown) {
      logger.error(`loyalty.tier_upgraded handler error: ${(err as Error).message}`);
    }
  });
}

function registerStoreEventHandlers(): void {
  // Store created -> notify merchant
  eventBus.registerHandler('store.created', async payload => {
    const data = payload.data as Record<string, unknown>;
    const storeId = data.storeId as string;
    const storeName = data.storeName as string;
    const organizationId = data.organizationId as string;
    if (!storeId) return;

    try {
      if (organizationId) {
        await JobScheduler.scheduleNotification({
          userId: organizationId,
          type: 'store_created',
          title: 'Store Created',
          message: `Store "${storeName || storeId}" has been created successfully.`,
          data: { storeId, storeName },
        });
      }
      logger.info(`store.created: store ${storeId} (${storeName}) created`);
    } catch (err: unknown) {
      logger.error(`store.created handler error: ${(err as Error).message}`);
    }
  });

  // Inventory linked to store -> log for audit
  eventBus.registerHandler('store.inventory_linked', async payload => {
    const data = payload.data as Record<string, unknown>;
    logger.info(`store.inventory_linked: store=${data.storeId}, location=${data.inventoryLocationId}`);
  });

  // Pickup configured -> log for audit
  eventBus.registerHandler('store.pickup_configured', async payload => {
    const data = payload.data as Record<string, unknown>;
    logger.info(`store.pickup_configured: store=${data.storeId}, method=${data.pickupMethod}`);
  });
}

function registerMerchantEventHandlers(): void {
  // Merchant approved -> send welcome notification
  eventBus.registerHandler('organization.approved', async payload => {
    const data = payload.data as Record<string, unknown>;
    const organizationId = data.organizationId as string;
    const businessName = data.businessName as string;
    if (!organizationId) return;

    try {
      await JobScheduler.scheduleNotification({
        userId: organizationId,
        type: 'merchant_approved',
        title: 'Merchant Account Approved',
        message: `Welcome to CommerceFull! Your merchant account${businessName ? ` "${businessName}"` : ''} has been approved.`,
        data: { organizationId, businessName },
        channels: ['email', 'in_app'],
      });
      logger.info(`organization.approved: merchant ${organizationId} (${businessName}) approved`);
    } catch (err: unknown) {
      logger.error(`organization.approved handler error: ${(err as Error).message}`);
    }
  });

  // Settlement created -> notify merchant
  eventBus.registerHandler('organization.settlement_created', async payload => {
    const data = payload.data as Record<string, unknown>;
    const organizationId = data.organizationId as string;
    const settlementId = data.settlementId as string;
    const amount = data.amount as number;
    if (!organizationId) return;

    try {
      await JobScheduler.scheduleNotification({
        userId: organizationId,
        type: 'settlement_created',
        title: 'Settlement Created',
        message: `A settlement of $${amount} has been created.`,
        data: { organizationId, settlementId, amount },
      });
      logger.info(`organization.settlement_created: settlement ${settlementId} for merchant ${organizationId}, amount=${amount}`);
    } catch (err: unknown) {
      logger.error(`organization.settlement_created handler error: ${(err as Error).message}`);
    }
  });

  // Payout processed -> notify merchant
  eventBus.registerHandler('organization.payout_processed', async payload => {
    const data = payload.data as Record<string, unknown>;
    const organizationId = data.organizationId as string;
    const payoutId = data.payoutId as string;
    const amount = data.amount as number;
    if (!organizationId) return;

    try {
      await JobScheduler.scheduleNotification({
        userId: organizationId,
        type: 'payout_processed',
        title: 'Payout Processed',
        message: `A payout of $${amount} has been processed to your account.`,
        data: { organizationId, payoutId, amount },
        channels: ['email', 'in_app'],
      });
      logger.info(`organization.payout_processed: payout ${payoutId} for merchant ${organizationId}, amount=${amount}`);
    } catch (err: unknown) {
      logger.error(`organization.payout_processed handler error: ${(err as Error).message}`);
    }
  });
}

function registerAnalyticsEventHandlers(): void {
  // Track all events for analytics (wildcard handler)
  // Note: The eventBus already emits to '*' for all events
  // This is where analytics tracking would be implemented
}

function registerBasketEventHandlers(): void {
  // Basket abandoned -> send cart recovery notification
  eventBus.registerHandler('basket.abandoned', async payload => {
    const data = payload.data as Record<string, unknown>;
    const basketId = data.basketId as string;
    const customerId = data.customerId as string;
    const totalValue = data.totalValue as number;
    const itemCount = data.itemCount as number;
    if (!basketId || !customerId) return;

    try {
      await JobScheduler.scheduleNotification({
        userId: customerId,
        type: 'cart_abandoned',
        title: 'You left items in your cart',
        message: `You have ${itemCount || 0} item(s) waiting in your cart${totalValue ? ` ($${totalValue.toFixed(2)})` : ''}. Come back and complete your purchase!`,
        data: { basketId, totalValue, itemCount },
        channels: ['email', 'push', 'in_app'],
      });
      logger.info(`basket.abandoned: sent recovery notification to customer ${customerId} for basket ${basketId}`);
    } catch (err: unknown) {
      logger.error(`basket.abandoned handler error: ${(err as Error).message}`);
    }
  });
}

function registerPaymentEventHandlers(): void {
  // Payment completed -> update order status, notify customer
  eventBus.registerHandler('payment.completed', async payload => {
    const data = payload.data as Record<string, unknown>;
    const orderId = data.orderId as string;
    const transactionId = data.transactionId as string;
    const amount = data.amount as number;
    if (!orderId) return;

    try {
      // Update order payment status
      await query('UPDATE "order" SET "paymentStatus" = \'paid\', "updatedAt" = now() WHERE "orderId" = $1', [orderId]);

      // Notify customer
      const order = await OrderRepo.findById(orderId);
      if (order?.customerId) {
        await JobScheduler.scheduleNotification({
          userId: order.customerId,
          type: 'payment_completed',
          title: 'Payment Received',
          message: `Your payment of $${(amount || 0).toFixed(2)} for order ${order.orderNumber} has been received.`,
          data: { orderId, orderNumber: order.orderNumber, transactionId, amount },
        });
      }

      logger.info(`payment.completed: order ${orderId} payment status updated to paid`);
    } catch (err: unknown) {
      logger.error(`payment.completed handler error: ${(err as Error).message}`);
    }
  });

  // Payment failed -> notify customer, emit order.payment_failed
  eventBus.registerHandler('payment.failed', async payload => {
    const data = payload.data as Record<string, unknown>;
    const orderId = data.orderId as string;
    const reason = data.reason as string;
    if (!orderId) return;

    try {
      const order = await OrderRepo.findById(orderId);
      if (!order) return;

      // Notify customer about payment failure
      if (order.customerId) {
        await JobScheduler.scheduleNotification({
          userId: order.customerId,
          type: 'payment_failed',
          title: 'Payment Failed',
          message: `Your payment for order ${order.orderNumber} failed${reason ? `: ${reason}` : ''}. Please try again.`,
          data: { orderId, orderNumber: order.orderNumber, reason },
          channels: ['email', 'push', 'in_app'],
        });
      }

      // Emit order.payment_failed so inventory reservations get released
      eventBus.emit('order.payment_failed', { orderId });

      logger.info(`payment.failed: order ${orderId} payment failed${reason ? ` (${reason})` : ''}`);
    } catch (err: unknown) {
      logger.error(`payment.failed handler error: ${(err as Error).message}`);
    }
  });

  // Payment refunded -> notify customer
  eventBus.registerHandler('payment.refunded', async payload => {
    const data = payload.data as Record<string, unknown>;
    const transactionId = data.transactionId as string;
    const amount = data.amount as number;
    if (!transactionId) return;

    try {
      // Find the order from the transaction
      const orderResult = await query<Array<{ orderId: string }>>(
        'SELECT "orderId" FROM "paymentTransaction" WHERE "transactionId" = $1',
        [transactionId],
      );
      const orderId = orderResult?.[0]?.orderId;
      if (!orderId) return;

      const order = await OrderRepo.findById(orderId);
      if (order?.customerId) {
        await JobScheduler.scheduleNotification({
          userId: order.customerId,
          type: 'payment_refunded',
          title: 'Refund Processed',
          message: `A refund of $${(amount || 0).toFixed(2)} for order ${order.orderNumber} has been processed.`,
          data: { orderId, orderNumber: order.orderNumber, transactionId, amount },
          channels: ['email', 'in_app'],
        });
      }

      logger.info(`payment.refunded: refund of $${amount} for transaction ${transactionId}`);
    } catch (err: unknown) {
      logger.error(`payment.refunded handler error: ${(err as Error).message}`);
    }
  });
}

function registerCustomerEventHandlers(): void {
  // Customer registered -> send welcome notification
  eventBus.registerHandler('customer.registered', async payload => {
    const data = payload.data as Record<string, unknown>;
    const customerId = data.customerId as string;
    const email = data.email as string;
    const firstName = data.firstName as string;
    if (!customerId) return;

    try {
      await JobScheduler.scheduleNotification({
        userId: customerId,
        type: 'customer_welcome',
        title: 'Welcome to CommerceFull!',
        message: `Welcome${firstName ? `, ${firstName}` : ''}! Your account has been created successfully. Start exploring our marketplace today.`,
        data: { customerId, email, firstName },
        channels: ['email', 'in_app'],
      });
      logger.info(`customer.registered: welcome notification sent to customer ${customerId} (${email})`);
    } catch (err: unknown) {
      logger.error(`customer.registered handler error: ${(err as Error).message}`);
    }
  });

  // Customer deleted -> GDPR cleanup log
  eventBus.registerHandler('customer.deleted', async payload => {
    const data = payload.data as Record<string, unknown>;
    const customerId = data.customerId as string;
    const email = data.email as string;
    if (!customerId) return;

    try {
      logger.info(`customer.deleted: customer ${customerId} (${email}) deleted, GDPR cleanup may be needed`);
    } catch (err: unknown) {
      logger.error(`customer.deleted handler error: ${(err as Error).message}`);
    }
  });
}

function registerProductEventHandlers(): void {
  // Product created -> log for search index update
  eventBus.registerHandler('product.created', async payload => {
    const data = payload.data as Record<string, unknown>;
    const productId = data.productId as string;
    const name = data.name as string;
    const sku = data.sku as string;
    if (!productId) return;

    try {
      logger.info(`product.created: product ${productId} (${name || sku}) created — search index update queued`);
      // Search index update would be triggered here if a search service is configured
    } catch (err: unknown) {
      logger.error(`product.created handler error: ${(err as Error).message}`);
    }
  });

  // Product updated -> log for cache invalidation and search index update
  eventBus.registerHandler('product.updated', async payload => {
    const data = payload.data as Record<string, unknown>;
    const productId = data.productId as string;
    const updatedFields = data.updatedFields as string[];
    if (!productId) return;

    try {
      logger.info(`product.updated: product ${productId} updated (fields: ${updatedFields?.join(', ') || 'unknown'}) — cache invalidation and search index update queued`);
      // Cache invalidation and search index update would be triggered here
    } catch (err: unknown) {
      logger.error(`product.updated handler error: ${(err as Error).message}`);
    }
  });
}

function registerSubscriptionEventHandlers(): void {
  // Subscription renewed -> notify customer
  eventBus.registerHandler('subscription.renewed', async payload => {
    const data = payload.data as Record<string, unknown>;
    const subscriptionId = data.subscriptionId as string;
    const customerId = data.customerId as string;
    const amount = data.amount as number;
    if (!subscriptionId || !customerId) return;

    try {
      await JobScheduler.scheduleNotification({
        userId: customerId,
        type: 'subscription_renewed',
        title: 'Subscription Renewed',
        message: `Your subscription has been renewed${amount ? ` for $${amount.toFixed(2)}` : ''}.`,
        data: { subscriptionId, customerId, amount },
        channels: ['email', 'in_app'],
      });
      logger.info(`subscription.renewed: subscription ${subscriptionId} renewed for customer ${customerId}`);
    } catch (err: unknown) {
      logger.error(`subscription.renewed handler error: ${(err as Error).message}`);
    }
  });

  // Subscription cancelled -> notify customer
  eventBus.registerHandler('subscription.cancelled', async payload => {
    const data = payload.data as Record<string, unknown>;
    const customerSubscriptionId = data.customerSubscriptionId as string;
    const customerId = data.customerId as string;
    const reason = data.reason as string;
    if (!customerSubscriptionId || !customerId) return;

    try {
      await JobScheduler.scheduleNotification({
        userId: customerId,
        type: 'subscription_cancelled',
        title: 'Subscription Cancelled',
        message: `Your subscription has been cancelled${reason ? `: ${reason}` : ''}. You will retain access until the end of your current billing period.`,
        data: { customerSubscriptionId, customerId, reason },
        channels: ['email', 'in_app'],
      });
      logger.info(`subscription.cancelled: subscription ${customerSubscriptionId} cancelled for customer ${customerId}`);
    } catch (err: unknown) {
      logger.error(`subscription.cancelled handler error: ${(err as Error).message}`);
    }
  });
}

function registerWebhookDispatch(): void {
  webhookDispatchService = new WebhookDispatchService(WebhookRepo);
  webhookDispatchService.start();
}

function registerIntegrationDispatcher(): void {
  const dispatcher = new IntegrationEventDispatcher(
    eventBus,
    integrationRepo,
    credentialRepo,
    subscriptionRepo,
    logRepo,
  );
  dispatcher.register();
  logger.info('Integration event dispatcher registered');
}
