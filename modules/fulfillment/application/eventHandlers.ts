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
import type { IFulfillmentRepository } from '../domain/repositories/FulfillmentRepository';
import { CreateFulfillmentUseCase } from './useCases/CreateFulfillment';
import { CancelFulfillmentUseCase, CancelFulfillmentCommand } from './useCases/CancelFulfillment';
import { planFulfillmentUseCase } from './wired';

/** Narrow ports for cross-module dependencies, injected at boot. */
export interface FulfillmentEventHandlerDeps {
  orders: Pick<OrderRepository, 'findById'>;
  reservations: {
    consumeByOrder(orderId: string): Promise<unknown>;
  };
  fulfillments: IFulfillmentRepository;
}

export function registerFulfillmentEventHandlers(deps: FulfillmentEventHandlerDeps): void {
  const { orders, reservations, fulfillments } = deps;

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

      // Idempotency — order.paid can be emitted by both the PSP webhook path and
      // the payment.received/payment.completed relays; never plan twice.
      const existing = await fulfillments.findByOrderId(orderId);
      if (existing.length > 0) {
        logger.info(`order.paid: order ${orderId} already has ${existing.length} fulfillment(s), skipping`);
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

      // Plan fulfillment across sources — splits items when a single store
      // can't fulfill everything; falls back to the default warehouse.
      const planResult = await planFulfillmentUseCase.execute(
        physicalItems.map(item => ({
          orderItemId: item.orderItemId,
          productId: item.productId,
          variantId: item.productVariantId,
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
        })),
      );

      if (planResult.groups.length === 0) {
        logger.warn(`order.paid: no fulfillment source found for order ${orderId}, fulfillment must be created manually`);
        return;
      }

      if (planResult.isSplit) {
        logger.info(`order.paid: order ${orderId} split across ${planResult.groups.length} fulfillment sources`);
      }

      const createFulfillmentUseCase = new CreateFulfillmentUseCase(fulfillments);
      for (const group of planResult.groups) {
        const result = await createFulfillmentUseCase.execute({
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          sourceType: group.sourceType,
          sourceId: group.sourceId,
          shipFromAddress: group.shipFromAddress as {
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
          items: group.items.map(i => ({
            orderItemId: i.orderItemId,
            productId: i.productId,
            variantId: i.variantId,
            sku: i.sku,
            name: i.name,
            quantityOrdered: i.quantity,
          })),
        });
        logger.info(
          `order.paid: fulfillment ${result.fulfillment.fulfillmentId} created for order ${orderId} (${group.sourceType}:${group.sourceId}, ${group.items.length} item(s))`,
        );
      }

      // Consume inventory reservations (mark as consumed so they aren't released)
      await reservations.consumeByOrder(orderId);
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

  // Order cancelled -> cancel any fulfillments that haven't left the building.
  // Shipped/in-transit/delivered fulfillments are skipped — the goods are already gone.
  eventBus.registerHandler('order.cancelled', async payload => {
    const data = payload.data as Record<string, unknown>;
    const orderId = data.orderId as string;
    if (!orderId) return;

    const open = (await fulfillments.findByOrderId(orderId)).filter(
      f => !['shipped', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'failed'].includes(f.status),
    );

    const cancelFulfillment = new CancelFulfillmentUseCase(fulfillments);
    for (const fulfillment of open) {
      try {
        await cancelFulfillment.execute(new CancelFulfillmentCommand(fulfillment.fulfillmentId, 'Order cancelled'));
      } catch (err: unknown) {
        logger.warn(`order.cancelled: could not cancel fulfillment ${fulfillment.fulfillmentId}: ${(err as Error).message}`);
      }
    }

    if (open.length > 0) {
      logger.info(`order.cancelled: cancelled ${open.length} fulfillment(s) for order ${orderId}`);
    }
  });
}
