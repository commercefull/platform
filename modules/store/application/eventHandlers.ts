/**
 * Store Event Handlers
 *
 * Notifies merchants on store creation and logs inventory/pickup
 * configuration changes for audit.
 *
 * Called from boot/registerEventHandlers.ts on app boot.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { logger } from '../../../libs/logger';
import { JobScheduler } from '../../../libs/jobs/cronScheduler';

export function registerStoreEventHandlers(): void {
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
