import { randomUUID } from 'crypto';
import { CommissionValidationError } from '../errors/MarketplaceErrors';

export type CommissionType = 'percentage' | 'fixed' | 'tiered';
export type CommissionScope = 'global' | 'category' | 'vendor' | 'product';

export interface CommissionTier {
  minAmount: number;
  maxAmount?: number;
  rate: number;
}

export interface CommissionRuleProps {
  ruleId: string;
  organizationId: string;
  name: string;
  type: CommissionType;
  scope: CommissionScope;
  rate: number;
  fixedAmount?: number;
  tiers?: CommissionTier[];
  categoryId?: string;
  vendorId?: string;
  productId?: string;
  priority: number;
  active: boolean;
  startsAt?: Date;
  endsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class CommissionRule {
  private readonly _ruleId: string;
  private _organizationId: string;
  private _name: string;
  private _type: CommissionType;
  private _scope: CommissionScope;
  private _rate: number;
  private _fixedAmount?: number;
  private _tiers?: CommissionTier[];
  private _categoryId?: string;
  private _vendorId?: string;
  private _productId?: string;
  private _priority: number;
  private _active: boolean;
  private _startsAt?: Date;
  private _endsAt?: Date;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: CommissionRuleProps) {
    this._ruleId = props.ruleId;
    this._organizationId = props.organizationId;
    this._name = props.name;
    this._type = props.type;
    this._scope = props.scope;
    this._rate = props.rate;
    this._fixedAmount = props.fixedAmount;
    this._tiers = props.tiers;
    this._categoryId = props.categoryId;
    this._vendorId = props.vendorId;
    this._productId = props.productId;
    this._priority = props.priority;
    this._active = props.active;
    this._startsAt = props.startsAt;
    this._endsAt = props.endsAt;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static create(input: {
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
  }): CommissionRule {
    if (input.type === 'percentage' && (input.rate === undefined || input.rate < 0 || input.rate > 100)) {
      throw new CommissionValidationError('Percentage commission requires rate between 0 and 100');
    }
    if (input.type === 'fixed' && input.fixedAmount === undefined) {
      throw new CommissionValidationError('Fixed commission requires fixedAmount');
    }
    if (input.type === 'tiered' && (!input.tiers || input.tiers.length === 0)) {
      throw new CommissionValidationError('Tiered commission requires at least one tier');
    }
    const now = new Date();
    return new CommissionRule({
      ruleId: randomUUID(),
      organizationId: input.organizationId,
      name: input.name,
      type: input.type,
      scope: input.scope,
      rate: input.rate ?? 0,
      fixedAmount: input.fixedAmount,
      tiers: input.tiers,
      categoryId: input.categoryId,
      vendorId: input.vendorId,
      productId: input.productId,
      priority: input.priority ?? 0,
      active: true,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: CommissionRuleProps): CommissionRule {
    return new CommissionRule(props);
  }

  get ruleId(): string { return this._ruleId; }
  get organizationId(): string { return this._organizationId; }
  get name(): string { return this._name; }
  get type(): CommissionType { return this._type; }
  get scope(): CommissionScope { return this._scope; }
  get rate(): number { return this._rate; }
  get fixedAmount(): number | undefined { return this._fixedAmount; }
  get tiers(): CommissionTier[] | undefined { return this._tiers; }
  get categoryId(): string | undefined { return this._categoryId; }
  get vendorId(): string | undefined { return this._vendorId; }
  get productId(): string | undefined { return this._productId; }
  get priority(): number { return this._priority; }
  get active(): boolean { return this._active; }
  get startsAt(): Date | undefined { return this._startsAt; }
  get endsAt(): Date | undefined { return this._endsAt; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  get isActive(): boolean {
    if (!this._active) return false;
    const now = new Date();
    if (this._startsAt && now < this._startsAt) return false;
    if (this._endsAt && now > this._endsAt) return false;
    return true;
  }

  calculate(amount: number): number {
    if (!this.isActive) return 0;
    switch (this._type) {
      case 'percentage':
        return (amount * this._rate) / 100;
      case 'fixed':
        return this._fixedAmount ?? 0;
      case 'tiered':
        return this.calculateTiered(amount);
      default:
        return 0;
    }
  }

  private calculateTiered(amount: number): number {
    if (!this._tiers || this._tiers.length === 0) return 0;
    const sorted = [...this._tiers].sort((a, b) => a.minAmount - b.minAmount);
    for (const tier of sorted) {
      if (amount >= tier.minAmount && (!tier.maxAmount || amount <= tier.maxAmount)) {
        return (amount * tier.rate) / 100;
      }
    }
    const last = sorted[sorted.length - 1];
    return (amount * last.rate) / 100;
  }

  activate(): void {
    this._active = true;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._active = false;
    this._updatedAt = new Date();
  }

  setPriority(priority: number): void {
    this._priority = priority;
    this._updatedAt = new Date();
  }

  updateRate(rate: number): void {
    if (rate < 0 || rate > 100) {
      throw new CommissionValidationError('Rate must be between 0 and 100');
    }
    this._rate = rate;
    this._updatedAt = new Date();
  }

  setValidity(startsAt?: Date, endsAt?: Date): void {
    this._startsAt = startsAt;
    this._endsAt = endsAt;
    this._updatedAt = new Date();
  }

  toJSON(): CommissionRuleProps {
    return {
      ruleId: this._ruleId,
      organizationId: this._organizationId,
      name: this._name,
      type: this._type,
      scope: this._scope,
      rate: this._rate,
      fixedAmount: this._fixedAmount,
      tiers: this._tiers,
      categoryId: this._categoryId,
      vendorId: this._vendorId,
      productId: this._productId,
      priority: this._priority,
      active: this._active,
      startsAt: this._startsAt,
      endsAt: this._endsAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
