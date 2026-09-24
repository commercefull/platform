/**
 * Fulfillment Event Handlers
 *
 * Subscribes to order/fulfillment lifecycle events: auto-creates
 * fulfillments on order.paid (with OrderRouter store selection and
 * warehouse fallback) and keeps order status + customer notifications
 * in sync with fulfillment progress.
 *
 * Called from boot/registerEventHandlers.ts on app boot.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { query } from '../../../libs/db';
import { logger } from '../../../libs/logger';
import { JobScheduler } from '../../../libs/jobs/cronScheduler';
import type { OrderRepository } from '../../order/domain/repositories/OrderRepository';
import { OrderRouter } from '../../order/domain/services/OrderRouter';
import type { StoreRepository } from '../../store/domain/repositories/StoreRepository';
import type { IFulfillmentRepository } from '../domain/repositories/FulfillmentRepository';
import { CreateFulfillmentUseCase } from './useCases/CreateFulfillment';

/** Narrow ports for cross-module dependencies, injected at boot. */
export interface FulfillmentEventHandlerDeps {
  orders: Pick<OrderRepository, 'findById'>;
  stores: Pick<StoreRepository, 'findActive'>;
  warehouses: {
    findDefault(): Promise<{
      distributionWarehouseId: string;
      name?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      phone?: string;
      email?: string;
    } | null>;
  };
  stock: {
    checkProductAvailability(
      productId: string,
      variantId: string | undefined,
      requiredQuantity: number,
    ): Promise<{ totalAvailable: number }>;
  };
  reservations: {
    consumeByOrder(orderId: string): Promise<unknown>;
  };
  fulfillments: IFulfillmentRepository;
}

export function registerFulfillmentEventHandlers(deps: FulfillmentEventHandlerDeps): void {
  const { orders, stores: storeRepo, warehouses, stock, reservations, fulfillments } = deps;

  // Order paid -> auto-create fulfillment from default warehouse
  eventBus.registerHandler('order.paid', async payload => {
    const eventData = payload.data as Record<string, unknown>;
    const orderId = eventData.orderId as string;
    if (!orderId) return;

    try {
      const order = await orders.findById(orderId);
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

        const createFulfillmentUseCase = new CreateFulfillmentUseCase(fulfillments);
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
        await reservations.consumeByOrder(orderId);

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

        logger.info(
          `order.paid: pickup fulfillment ${result.fulfillment.fulfillmentId} created for order ${orderId} at ${pickupLocationName}`,
        );
        return;
      }

      // Standard shipping fulfillment flow
      // Try intelligent routing via OrderRouter first, fall back to default warehouse
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

      // Attempt to find a store with inventory via OrderRouter
      let fulfillmentSourceType: 'warehouse' | 'store' = 'warehouse';
      let fulfillmentSourceId = '';
      let shipFromAddress: Record<string, unknown>;

      try {
        const stores = await storeRepo.findActive();
        const orderRouter = new OrderRouter(
          {
            findById: async (id: string) => {
              const s = stores.find(s => s.storeId === id);
              return s
                ? {
                    storeId: s.storeId,
                    name: s.name,
                    canFulfillOnline: s.settings?.allowGuestCheckout ?? true,
                    canPickupInStore: s.settings?.pickup?.enabled ?? false,
                    localDeliveryEnabled: s.settings?.localDelivery?.enabled ?? false,
                  }
                : null;
            },
          },
          {
            getAvailableQuantity: async (_storeId: string, productId: string, variantId?: string) => {
              const avail = await stock.checkProductAvailability(productId, variantId, 1);
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
        const warehouse = await warehouses.findDefault();
        if (!warehouse) {
          logger.warn(`order.paid: no default warehouse found for order ${orderId}, fulfillment must be created manually`);
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
      const createFulfillmentUseCase = new CreateFulfillmentUseCase(fulfillments);
      const result = await createFulfillmentUseCase.execute({
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        sourceType: fulfillmentSourceType,
        sourceId: fulfillmentSourceId,
        shipFromAddress: shipFromAddress as {
          addressLine1: string;
          city: string;
          postalCode: string;
          countryCode: string;
          firstName?: string;
          lastName?: string;
          company?: string;
          addressLine2?: string;
          state?: string;
          phone?: string;
          email?: string;
        },
        shipToAddress,
        items: fulfillmentItems,
      });

      // Consume inventory reservations (mark as consumed so they aren't released)
      await reservations.consumeByOrder(orderId);

      logger.info(`order.paid: fulfillment ${result.fulfillment.fulfillmentId} created for order ${orderId}`);
    } catch (err: unknown) {
      logger.error(`order.paid fulfillment handler error: ${(err as Error).message}`);
    }
  });

  // Fulfillment created -> notify customer
  eventBus.registerHandler('fulfillment.created', async payload => {
    const data = payload.data as Record<string, unknown>;
    const orderId = data.orderId as string;
    const customerId = data.customerId as string;
    const fulfillmentId = data.fulfillmentId as string;
    if (!orderId || !customerId) return;

    try {
      const order = await orders.findById(orderId);
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
        const order = await orders.findById(orderId);
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
        const order = await orders.findById(orderId);
        await JobScheduler.scheduleNotification({
          userId: customerId,
          type: 'order_delivered',
          title: 'Order Delivered',
          message: `Your order ${order?.orderNumber || orderId} has been delivered.`,
          data: { orderId, orderNumber: order?.orderNumber },
        });
      }

      // Emit order.completed for loyalty points and analytics
      eventBus.emit('order.completed', { orderId, customerId, orderNumber: (await orders.findById(orderId))?.orderNumber });

      logger.info(`fulfillment.delivered: order ${orderId} marked delivered, emitted order.completed`);
    } catch (err: unknown) {
      logger.error(`fulfillment.delivered handler error: ${(err as Error).message}`);
    }
  });
}
