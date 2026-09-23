import { VendorPayout, PayoutMethod, PayoutLineItem } from '../../domain/entities/VendorPayout';
import { VendorRepository, VendorPayoutRepository } from '../../domain/repositories/MarketplaceRepository';
import { VendorNotFoundError, VendorStatusError, PayoutNotFoundError } from '../../domain/errors/MarketplaceErrors';
import { eventBus } from '../../../../libs/events/eventBus';

export class ManagePayoutUseCase {
  constructor(
    private payoutRepo: VendorPayoutRepository,
    private vendorRepo: VendorRepository,
  ) {}

  async create(input: {
    vendorId: string;
    organizationId: string;
    method: PayoutMethod;
    periodStart: Date;
    periodEnd: Date;
    currency?: string;
    lineItems?: PayoutLineItem[];
  }): Promise<VendorPayout> {
    const vendor = await this.vendorRepo.findById(input.vendorId);
    if (!vendor) throw new VendorNotFoundError(input.vendorId);
    if (!vendor.isApproved) throw new VendorStatusError(input.vendorId, 'create payout for', vendor.status);

    const payout = VendorPayout.create(input);
    await this.payoutRepo.save(payout);
    await eventBus.emit('marketplace.payout.created', {
      payoutId: payout.payoutId,
      vendorId: payout.vendorId,
      netAmount: payout.netAmount,
    });
    return payout;
  }

  async get(payoutId: string): Promise<VendorPayout> {
    const payout = await this.payoutRepo.findById(payoutId);
    if (!payout) throw new PayoutNotFoundError(payoutId);
    return payout;
  }

  async listByVendor(vendorId: string): Promise<VendorPayout[]> {
    return this.payoutRepo.findByVendorId(vendorId);
  }

  async listByOrganization(organizationId: string): Promise<VendorPayout[]> {
    return this.payoutRepo.findByOrganizationId(organizationId);
  }

  async listByStatus(status: string, organizationId: string): Promise<VendorPayout[]> {
    return this.payoutRepo.findByStatus(status, organizationId);
  }

  async addLineItem(payoutId: string, item: Omit<PayoutLineItem, 'payoutDate'>): Promise<VendorPayout> {
    const payout = await this.get(payoutId);
    payout.addLineItem(item);
    await this.payoutRepo.save(payout);
    return payout;
  }

  async startProcessing(payoutId: string): Promise<VendorPayout> {
    const payout = await this.get(payoutId);
    payout.startProcessing();
    await this.payoutRepo.save(payout);
    await eventBus.emit('marketplace.payout.processing', { payoutId: payout.payoutId });
    return payout;
  }

  async complete(payoutId: string, transactionRef?: string): Promise<VendorPayout> {
    const payout = await this.get(payoutId);
    payout.complete(transactionRef);
    await this.payoutRepo.save(payout);

    const vendor = await this.vendorRepo.findById(payout.vendorId);
    if (vendor) {
      vendor.recordPayout(payout.netAmount);
      await this.vendorRepo.save(vendor);
    }
    await eventBus.emit('marketplace.payout.completed', {
      payoutId: payout.payoutId,
      vendorId: payout.vendorId,
      netAmount: payout.netAmount,
    });
    return payout;
  }

  async fail(payoutId: string, reason: string): Promise<VendorPayout> {
    const payout = await this.get(payoutId);
    payout.fail(reason);
    await this.payoutRepo.save(payout);
    await eventBus.emit('marketplace.payout.failed', { payoutId: payout.payoutId, reason });
    return payout;
  }

  async retry(payoutId: string): Promise<VendorPayout> {
    const payout = await this.get(payoutId);
    payout.retry();
    await this.payoutRepo.save(payout);
    return payout;
  }

  async cancel(payoutId: string): Promise<VendorPayout> {
    const payout = await this.get(payoutId);
    payout.cancel();
    await this.payoutRepo.save(payout);
    return payout;
  }

  async setMethod(payoutId: string, method: PayoutMethod): Promise<VendorPayout> {
    const payout = await this.get(payoutId);
    payout.setMethod(method);
    await this.payoutRepo.save(payout);
    return payout;
  }
}
