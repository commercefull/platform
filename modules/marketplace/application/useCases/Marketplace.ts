import { Vendor, VendorTier, VendorAddress, VendorBankInfo } from '../../domain/entities/Vendor';
import { CommissionRule, CommissionType, CommissionScope, CommissionTier } from '../../domain/entities/CommissionRule';
import { VendorPayout, PayoutMethod, PayoutLineItem } from '../../domain/entities/VendorPayout';
import {
  VendorRepository,
  CommissionRuleRepository,
  VendorPayoutRepository,
} from '../../domain/repositories/MarketplaceRepository';
import {
  VendorNotFoundError,
  VendorAlreadyExistsError,
  VendorStatusError,
  CommissionRuleNotFoundError,
  PayoutNotFoundError,
} from '../../domain/errors/MarketplaceErrors';
import { eventBus } from '../../../../libs/events/eventBus';
import { logger } from '../../../../libs/logger';

// ─── Vendor Use Cases ───

export class ManageVendorUseCase {
  constructor(private vendorRepo: VendorRepository) {}

  async create(input: {
    organizationId: string;
    name: string;
    email: string;
    legalName?: string;
    taxId?: string;
    phone?: string;
    website?: string;
    logoUrl?: string;
    description?: string;
    commissionRate?: number;
    tier?: VendorTier;
    address?: VendorAddress;
    bankInfo?: VendorBankInfo;
  }): Promise<Vendor> {
    const existing = await this.vendorRepo.findByEmail(input.email, input.organizationId);
    if (existing) throw new VendorAlreadyExistsError(input.name);

    const vendor = Vendor.create(input);
    await this.vendorRepo.save(vendor);
    await eventBus.emit('marketplace.vendor.registered', { vendorId: vendor.vendorId, organizationId: vendor.organizationId, name: vendor.name });
    logger.info('Vendor created', { vendorId: vendor.vendorId, name: vendor.name });
    return vendor;
  }

  async get(vendorId: string): Promise<Vendor> {
    const vendor = await this.vendorRepo.findById(vendorId);
    if (!vendor) throw new VendorNotFoundError(vendorId);
    return vendor;
  }

  async listByOrganization(organizationId: string): Promise<Vendor[]> {
    return this.vendorRepo.findByOrganizationId(organizationId);
  }

  async listByStatus(status: string, organizationId: string): Promise<Vendor[]> {
    return this.vendorRepo.findByStatus(status, organizationId);
  }

  async updateProfile(vendorId: string, updates: {
    name?: string;
    legalName?: string;
    taxId?: string;
    email?: string;
    phone?: string;
    website?: string;
    logoUrl?: string;
    description?: string;
  }): Promise<Vendor> {
    const vendor = await this.get(vendorId);
    vendor.updateProfile(updates);
    await this.vendorRepo.save(vendor);
    return vendor;
  }

  async setAddress(vendorId: string, address: VendorAddress): Promise<Vendor> {
    const vendor = await this.get(vendorId);
    vendor.setAddress(address);
    await this.vendorRepo.save(vendor);
    return vendor;
  }

  async setBankInfo(vendorId: string, bankInfo: VendorBankInfo): Promise<Vendor> {
    const vendor = await this.get(vendorId);
    vendor.setBankInfo(bankInfo);
    await this.vendorRepo.save(vendor);
    return vendor;
  }

  async approve(vendorId: string): Promise<Vendor> {
    const vendor = await this.get(vendorId);
    vendor.approve();
    await this.vendorRepo.save(vendor);
    await eventBus.emit('marketplace.vendor.approved', { vendorId: vendor.vendorId });
    return vendor;
  }

  async suspend(vendorId: string): Promise<Vendor> {
    const vendor = await this.get(vendorId);
    vendor.suspend();
    await this.vendorRepo.save(vendor);
    await eventBus.emit('marketplace.vendor.suspended', { vendorId: vendor.vendorId });
    return vendor;
  }

  async terminate(vendorId: string): Promise<Vendor> {
    const vendor = await this.get(vendorId);
    vendor.terminate();
    await this.vendorRepo.save(vendor);
    await eventBus.emit('marketplace.vendor.terminated', { vendorId: vendor.vendorId });
    return vendor;
  }

  async setTier(vendorId: string, tier: VendorTier): Promise<Vendor> {
    const vendor = await this.get(vendorId);
    vendor.setTier(tier);
    await this.vendorRepo.save(vendor);
    return vendor;
  }

  async setCommissionRate(vendorId: string, rate: number): Promise<Vendor> {
    const vendor = await this.get(vendorId);
    vendor.setCommissionRate(rate);
    await this.vendorRepo.save(vendor);
    return vendor;
  }

  async recordOrder(vendorId: string, revenue: number): Promise<Vendor> {
    const vendor = await this.get(vendorId);
    vendor.recordOrder(revenue);
    await this.vendorRepo.save(vendor);
    return vendor;
  }

  async updateRating(vendorId: string, rating: number): Promise<Vendor> {
    const vendor = await this.get(vendorId);
    vendor.updateRating(rating);
    await this.vendorRepo.save(vendor);
    return vendor;
  }
}

// ─── Commission Rule Use Cases ───

export class ManageCommissionRuleUseCase {
  constructor(
    private ruleRepo: CommissionRuleRepository,
    private vendorRepo: VendorRepository,
  ) {}

  async create(input: {
    organizationId: string;
    name: string;
    type: CommissionType;
    scope: CommissionScope;
    rate?: number;
    fixedAmount?: number;
    tiers?: CommissionTier[];
    categoryId?: string;
    vendorId?: string;
    productId?: string;
    priority?: number;
    startsAt?: Date;
    endsAt?: Date;
  }): Promise<CommissionRule> {
    if (input.scope === 'vendor' && input.vendorId) {
      const vendor = await this.vendorRepo.findById(input.vendorId);
      if (!vendor) throw new VendorNotFoundError(input.vendorId);
    }
    const rule = CommissionRule.create(input);
    await this.ruleRepo.save(rule);
    await eventBus.emit('marketplace.commission.created', { ruleId: rule.ruleId, organizationId: rule.organizationId });
    return rule;
  }

  async get(ruleId: string): Promise<CommissionRule> {
    const rule = await this.ruleRepo.findById(ruleId);
    if (!rule) throw new CommissionRuleNotFoundError(ruleId);
    return rule;
  }

  async listByOrganization(organizationId: string): Promise<CommissionRule[]> {
    return this.ruleRepo.findByOrganizationId(organizationId);
  }

  async listActive(organizationId: string): Promise<CommissionRule[]> {
    return this.ruleRepo.findActiveByOrganizationId(organizationId);
  }

  async listByVendor(vendorId: string, organizationId: string): Promise<CommissionRule[]> {
    return this.ruleRepo.findByVendorId(vendorId, organizationId);
  }

  async listByCategory(categoryId: string, organizationId: string): Promise<CommissionRule[]> {
    return this.ruleRepo.findByCategoryId(categoryId, organizationId);
  }

  async updateRate(ruleId: string, rate: number): Promise<CommissionRule> {
    const rule = await this.get(ruleId);
    rule.updateRate(rate);
    await this.ruleRepo.save(rule);
    return rule;
  }

  async setPriority(ruleId: string, priority: number): Promise<CommissionRule> {
    const rule = await this.get(ruleId);
    rule.setPriority(priority);
    await this.ruleRepo.save(rule);
    return rule;
  }

  async setValidity(ruleId: string, startsAt?: Date, endsAt?: Date): Promise<CommissionRule> {
    const rule = await this.get(ruleId);
    rule.setValidity(startsAt, endsAt);
    await this.ruleRepo.save(rule);
    return rule;
  }

  async activate(ruleId: string): Promise<CommissionRule> {
    const rule = await this.get(ruleId);
    rule.activate();
    await this.ruleRepo.save(rule);
    return rule;
  }

  async deactivate(ruleId: string): Promise<CommissionRule> {
    const rule = await this.get(ruleId);
    rule.deactivate();
    await this.ruleRepo.save(rule);
    return rule;
  }

  async delete(ruleId: string): Promise<void> {
    const rule = await this.get(ruleId);
    await this.ruleRepo.delete(rule.ruleId);
  }

  async calculateCommission(organizationId: string, vendorId: string, amount: number, categoryId?: string, productId?: string): Promise<number> {
    const rules = await this.ruleRepo.findActiveByOrganizationId(organizationId);
    const applicable = rules
      .filter(r => {
        if (r.scope === 'global') return true;
        if (r.scope === 'vendor' && r.vendorId === vendorId) return true;
        if (r.scope === 'category' && categoryId && r.categoryId === categoryId) return true;
        if (r.scope === 'product' && productId && r.productId === productId) return true;
        return false;
      })
      .sort((a, b) => b.priority - a.priority);

    if (applicable.length === 0) return 0;
    return applicable[0].calculate(amount);
  }
}

// ─── Payout Use Cases ───

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
    await eventBus.emit('marketplace.payout.created', { payoutId: payout.payoutId, vendorId: payout.vendorId, netAmount: payout.netAmount });
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
    await eventBus.emit('marketplace.payout.completed', { payoutId: payout.payoutId, vendorId: payout.vendorId, netAmount: payout.netAmount });
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
