/**
 * Organization Event Handlers
 *
 * Notifies merchants on approval, settlement, and payout lifecycle events.
 *
 * Called from boot/registerEventHandlers.ts on app boot.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { logger } from '../../../libs/logger';
import { JobScheduler } from '../../../libs/jobs/cronScheduler';

export function registerOrganizationEventHandlers(): void {
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
        message: `Welcome to Commercefull! Your merchant account${businessName ? ` "${businessName}"` : ''} has been approved.`,
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
