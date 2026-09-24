/**
 * Inventory Event Handlers
 *
 * Subscribes to order lifecycle events to reserve/release stock and
 * emits/handles stock-level alerts.
 *
 * Called from boot/registerEventHandlers.ts on app boot.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { query } from '../../../libs/db';
import { logger } from '../../../libs/logger';
import { JobScheduler } from '../../../libs/jobs/cronScheduler';
import type { OrderRepository } from '../../order/domain/repositories/OrderRepository';

/** Narrow ports for cross-module dependencies, injected at boot. */
export interface InventoryEventHandlerDeps {
  orders: Pick<OrderRepository, 'findById'>;
  stock: {
    checkProductAvailability(
      productId: string,
      variantId: string | undefined,
      requiredQuantity: number,
    ): Promise<{ available: boolean; locations: unknown[] }>;
  };
  reservations: {
    createAtomic(params: {
      orderId: string;
      productId: string;
      variantId?: string;
      sku?: string;
      inventoryItemId: string;
      locationId: string;
      quantity: number;
      expiresAt?: Date;
    }): Promise<unknown>;
    releaseByOrder(orderId: string): Promise<unknown>;
  };
}

export function registerInventoryEventHandlers(deps: InventoryEventHandlerDeps): void {
  const { orders, stock, reservations } = deps;

  // Order created -> reserve inventory atomically
  eventBus.registerHandler('order.created', async payload => {
    const eventData = payload.data as Record<string, unknown>;
    const orderId = eventData.orderId as string;
    if (!orderId) return;

    try {
      const order = await orders.findById(orderId);
      if (!order) return;

      for (const item of order.items) {
        try {
          const availability = await stock.checkProductAvailability(item.productId, item.productVariantId, item.quantity);

          if (availability.available && availability.locations.length > 0) {
            const loc = availability.locations[0] as Record<string, unknown>;
            const locationId: string = (loc.locationId as string) || (loc.inventoryLocationId as string) || '';
            if (!locationId) continue;

            const reservation = await reservations.createAtomic({
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

  // Order cancelled -> release inventory reservations
  eventBus.registerHandler('order.cancelled', async payload => {
    const eventData = payload.data as Record<string, unknown>;
    const orderId = eventData.orderId as string;
    if (!orderId) return;
    try {
      await reservations.releaseByOrder(orderId);
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
      await reservations.releaseByOrder(orderId);
    } catch (err: unknown) {
      logger.error(`order.payment_failed inventory release error: ${(err as Error).message}`);
    }
  });

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
