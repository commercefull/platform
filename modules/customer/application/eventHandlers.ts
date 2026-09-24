/**
 * Customer Event Handlers
 *
 * Sends the welcome notification on registration and logs deletions
 * for GDPR follow-up.
 *
 * Called from boot/registerEventHandlers.ts on app boot.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { logger } from '../../../libs/logger';
import { JobScheduler } from '../../../libs/jobs/cronScheduler';

export function registerCustomerEventHandlers(): void {
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
        title: 'Welcome to Commercefull!',
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
