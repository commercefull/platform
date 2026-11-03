/**
 * Inventory Scheduled Jobs
 *
 * Reservation cleanup, stock sync, and low/out-of-stock detection.
 * Collected by boot/scheduledJobs.ts at app boot.
 */

import { query } from '../../libs/db';
import { eventBus } from '../../libs/events/eventBus';
import { logger } from '../../libs/logger';
import { MINUTES, HOURS, ScheduledJobDefinition } from '../../libs/jobs/cronScheduler';
import { releaseExpired } from './infrastructure/repositories/inventoryReservationRepo';

export const scheduledJobs: ScheduledJobDefinition[] = [
  {
    // Cleanup expired reservations every 5 minutes
    id: 'cleanup-expired-reservations',
    name: 'Cleanup Expired Reservations',
    handler: async () => {
      const count = await releaseExpired();
      if (count > 0) {
        logger.info('Released expired inventory reservations', { count });
      }
    },
    intervalMs: 5 * MINUTES,
  },
  {
    // Sync inventory every 6 hours
    id: 'inventory-sync',
    name: 'Inventory Sync',
    handler: async () => {
      try {
        const synced = await query<{ inventoryLocationId: string }[]>(
          `UPDATE "inventoryLocation"
           SET "availableQuantity" = "quantity" - "reservedQuantity", "updatedAt" = now()
           WHERE "availableQuantity" <> "quantity" - "reservedQuantity"
           RETURNING "inventoryLocationId"`,
        );
        logger.info(`[cron] inventory-sync: synced ${synced?.length || 0} inventory locations`);
      } catch (err: unknown) {
        logger.error('inventory-sync error', { error: (err as Error).message });
      }
    },
    intervalMs: 6 * HOURS,
  },
  {
    // Check low stock items every hour
    id: 'low-stock-check',
    name: 'Low Stock Check',
    handler: async () => {
      try {
        const lowStockItems = await query<
          Array<{ productId: string; sku: string; availableQuantity: string; reservedQuantity: string; minStockLevel: string }>
        >(
          `SELECT il."productId", p.sku, il."availableQuantity", il."reservedQuantity", il."minStockLevel"
           FROM "inventoryLevel" il
           LEFT JOIN product p ON il."productId" = p."productId"
           WHERE (il."availableQuantity" - il."reservedQuantity") > 0
             AND (il."availableQuantity" - il."reservedQuantity") <= COALESCE(il."minStockLevel", 0)`,
        );

        for (const item of lowStockItems || []) {
          const currentStock = parseInt(item.availableQuantity, 10) - parseInt(item.reservedQuantity, 10);
          const reorderPoint = parseInt(item.minStockLevel, 10);
          eventBus.emit('inventory.low', {
            productId: item.productId,
            sku: item.sku,
            currentStock,
            reorderPoint,
          });
        }

        const outOfStockItems = await query<Array<{ productId: string; sku: string }>>(
          `SELECT il."productId", p.sku
           FROM "inventoryLevel" il
           LEFT JOIN product p ON il."productId" = p."productId"
           WHERE (il."availableQuantity" - il."reservedQuantity") <= 0`,
        );

        for (const item of outOfStockItems || []) {
          eventBus.emit('inventory.out_of_stock', {
            productId: item.productId,
            sku: item.sku,
          });
        }

        logger.info(`[cron] low-stock-check: ${lowStockItems?.length || 0} low stock, ${outOfStockItems?.length || 0} out of stock`);
      } catch (err: unknown) {
        logger.error('low-stock-check error', { error: (err as Error).message });
      }
    },
    intervalMs: 1 * HOURS,
  },
];
