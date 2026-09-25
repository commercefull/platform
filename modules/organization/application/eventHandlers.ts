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
import type { VendorRepository } from '../../marketplace/domain/repositories/MarketplaceRepository';

export interface OrganizationEventHandlerDeps {
  vendors: Pick<VendorRepository, 'findById'>;
}

export function registerOrganizationEventHandlers(deps: OrganizationEventHandlerDeps): void {
  const { vendors } = deps;
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

  // Vendor payout created -> notify the vendor's organization (settlement created)
  eventBus.registerHandler('marketplace.payout.created', async payload => {
    const data = payload.data as Record<string, unknown>;
    const vendorId = data.vendorId as string;
    const payoutId = data.payoutId as string;
    const netAmountCents = data.netAmountCents as number;
    if (!vendorId) return;

    try {
      const vendor = await vendors.findById(vendorId);
      if (!vendor?.organizationId) return;
      const amount = (netAmountCents ?? 0) / 100;

      await JobScheduler.scheduleNotification({
        userId: vendor.organizationId,
        type: 'settlement_created',
        title: 'Settlement Created',
        message: `A settlement of $${amount} has been created.`,
        data: { organizationId: vendor.organizationId, settlementId: payoutId, amount },
      });
      logger.info(`marketplace.payout.created: settlement ${payoutId} for organization ${vendor.organizationId}, amount=${amount}`);
    } catch (err: unknown) {
      logger.error(`marketplace.payout.created org handler error: ${(err as Error).message}`);
    }
  });

  // Vendor payout completed -> notify the vendor's organization (payout processed)
  eventBus.registerHandler('marketplace.payout.completed', async payload => {
    const data = payload.data as Record<string, unknown>;
    const vendorId = data.vendorId as string;
    const payoutId = data.payoutId as string;
    const netAmountCents = data.netAmountCents as number;
    if (!vendorId) return;

    try {
      const vendor = await vendors.findById(vendorId);
      if (!vendor?.organizationId) return;
      const amount = (netAmountCents ?? 0) / 100;

      await JobScheduler.scheduleNotification({
        userId: vendor.organizationId,
        type: 'payout_processed',
        title: 'Payout Processed',
        message: `A payout of $${amount} has been processed to your account.`,
        data: { organizationId: vendor.organizationId, payoutId, amount },
        channels: ['email', 'in_app'],
      });
      logger.info(`marketplace.payout.completed: payout ${payoutId} for organization ${vendor.organizationId}, amount=${amount}`);
    } catch (err: unknown) {
      logger.error(`marketplace.payout.completed org handler error: ${(err as Error).message}`);
    }
  });
}
