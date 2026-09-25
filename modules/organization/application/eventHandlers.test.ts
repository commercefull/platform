/**
 * Tests for organization event handlers.
 *
 * organization.approved notifies the merchant; vendor payout lifecycle events
 * (marketplace.payout.created / marketplace.payout.completed) notify the
 * vendor's organization — resolved through the vendor lookup.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { JobScheduler } from '../../../libs/jobs/cronScheduler';
import { registerOrganizationEventHandlers, type OrganizationEventHandlerDeps } from './eventHandlers';
import { Vendor, type VendorProps } from '../../marketplace/domain/entities/Vendor';

jest.mock('../../../libs/jobs/cronScheduler', () => ({
  __esModule: true,
  JobScheduler: { scheduleNotification: jest.fn() },
}));

const scheduleNotification = jest.mocked(JobScheduler.scheduleNotification);

function makeVendor(organizationId: string): Vendor {
  return Vendor.reconstitute({
    vendorId: 'vend-1',
    organizationId,
    name: 'Vendor Co',
    email: 'vendor@example.com',
    status: 'approved',
    tier: 'standard',
    commissionRate: 10,
    stats: {
      totalOrders: 0,
      totalRevenueCents: 0,
      totalPayoutsCents: 0,
      outstandingBalanceCents: 0,
      averageRating: 0,
      productCount: 0,
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as VendorProps);
}

describe('Organization event handlers', () => {
  let vendors: { findById: jest.Mock };

  beforeEach(() => {
    (eventBus as unknown as { handlers: Map<string, unknown> }).handlers.clear();
    scheduleNotification.mockClear();
    vendors = { findById: jest.fn().mockResolvedValue(makeVendor('org-1')) };
    registerOrganizationEventHandlers({ vendors } as unknown as { vendors: OrganizationEventHandlerDeps['vendors'] });
  });

  afterEach(() => {
    (eventBus as unknown as { handlers: Map<string, unknown> }).handlers.clear();
  });

  it('should notify the merchant when organization.approved fires', async () => {
    await eventBus.emit('organization.approved', { organizationId: 'org-1', businessName: 'Acme' });

    expect(scheduleNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'org-1',
        type: 'merchant_approved',
        data: { organizationId: 'org-1', businessName: 'Acme' },
      }),
    );
  });

  it('should notify the vendor organization when marketplace.payout.created fires', async () => {
    await eventBus.emit('marketplace.payout.created', {
      payoutId: 'po-1',
      vendorId: 'vend-1',
      netAmountCents: 12500,
    });

    expect(vendors.findById).toHaveBeenCalledWith('vend-1');
    expect(scheduleNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'org-1',
        type: 'settlement_created',
        data: { organizationId: 'org-1', settlementId: 'po-1', amount: 125 },
      }),
    );
  });

  it('should notify the vendor organization when marketplace.payout.completed fires', async () => {
    await eventBus.emit('marketplace.payout.completed', {
      payoutId: 'po-1',
      vendorId: 'vend-1',
      netAmountCents: 12500,
    });

    expect(scheduleNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'org-1',
        type: 'payout_processed',
        data: { organizationId: 'org-1', payoutId: 'po-1', amount: 125 },
      }),
    );
  });

  it('should not notify when the vendor does not exist', async () => {
    vendors.findById.mockResolvedValue(null);

    await eventBus.emit('marketplace.payout.completed', {
      payoutId: 'po-1',
      vendorId: 'vend-missing',
      netAmountCents: 100,
    });

    expect(scheduleNotification).not.toHaveBeenCalled();
  });

  it('should not notify when the payout event has no vendorId', async () => {
    await eventBus.emit('marketplace.payout.completed', { payoutId: 'po-1' });

    expect(vendors.findById).not.toHaveBeenCalled();
    expect(scheduleNotification).not.toHaveBeenCalled();
  });
});
