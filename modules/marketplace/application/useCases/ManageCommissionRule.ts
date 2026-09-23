import { CommissionRule, CommissionType, CommissionScope, CommissionTier } from '../../domain/entities/CommissionRule';
import { VendorRepository, CommissionRuleRepository } from '../../domain/repositories/MarketplaceRepository';
import { VendorNotFoundError, CommissionRuleNotFoundError } from '../../domain/errors/MarketplaceErrors';
import { eventBus } from '../../../../libs/events/eventBus';

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

  async calculateCommission(
    organizationId: string,
    vendorId: string,
    amount: number,
    categoryId?: string,
    productId?: string,
  ): Promise<number> {
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

