/**
 * Price Rule Entity
 */

export type PriceRuleType = 'fixed' | 'percentage' | 'tiered' | 'volume' | 'time_based';
export type PriceRuleTarget = 'product' | 'category' | 'customer_group' | 'all';

export interface TierPrice {
  minQuantity: number;
  maxQuantity?: number;
  price: number;
  discountPercent?: number;
}

export interface PriceRuleProps {
  ruleId: string;
  name: string;
  description?: string;
  type: PriceRuleType;
  target: PriceRuleTarget;
  targetIds?: string[];
  value: number;
  tiers?: TierPrice[];
  minQuantity?: number;
  maxQuantity?: number;
  startDate?: Date;
  endDate?: Date;
  priority: number;
  isActive: boolean;
  merchantId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class PriceRule {
  private props: PriceRuleProps;

  private constructor(props: PriceRuleProps) {
    this.props = props;
  }

  static create(props: {
    ruleId: string;
    name: string;
    description?: string;
    type: PriceRuleType;
    target: PriceRuleTarget;
    targetIds?: string[];
    value: number;
    tiers?: TierPrice[];
    minQuantity?: number;
    maxQuantity?: number;
    startDate?: Date;
    endDate?: Date;
    priority?: number;
    merchantId?: string;
    metadata?: Record<string, any>;
  }): PriceRule {
    const now = new Date();
    return new PriceRule({
      ruleId: props.ruleId,
      name: props.name,
      description: props.description,
      type: props.type,
      target: props.target,
      targetIds: props.targetIds,
      value: props.value,
      tiers: props.tiers,
      minQuantity: props.minQuantity,
      maxQuantity: props.maxQuantity,
      startDate: props.startDate,
      endDate: props.endDate,
      priority: props.priority ?? 0,
      isActive: true,
      merchantId: props.merchantId,
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: PriceRuleProps): PriceRule {
    return new PriceRule(props);
  }

  // Getters
  get ruleId(): string {
    return this.props.ruleId;
  }
  get name(): string {
    return this.props.name;
  }
  get type(): PriceRuleType {
    return this.props.type;
  }
  get target(): PriceRuleTarget {
    return this.props.target;
  }
  get value(): number {
    return this.props.value;
  }
  get tiers(): TierPrice[] | undefined {
    return this.props.tiers;
  }
  get priority(): number {
    return this.props.priority;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get startDate(): Date | undefined {
    return this.props.startDate;
  }
  get endDate(): Date | undefined {
    return this.props.endDate;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Computed
  get isCurrentlyActive(): boolean {
    if (!this.props.isActive) return false;
    const now = new Date();
    if (this.props.startDate && now < this.props.startDate) return false;
    if (this.props.endDate && now > this.props.endDate) return false;
    return true;
  }

  // Domain methods
  calculatePrice(basePrice: number, quantity: number = 1): number {
    if (!this.isCurrentlyActive) return basePrice;

    switch (this.props.type) {
      case 'fixed':
        return this.props.value;
      case 'percentage':
        return basePrice * (1 - this.props.value / 100);
      case 'tiered':
        return this.calculateTieredPrice(basePrice, quantity);
      case 'volume':
        return this.calculateVolumePrice(basePrice, quantity);
      default:
        return basePrice;
    }
  }

  private calculateTieredPrice(basePrice: number, quantity: number): number {
    if (!this.props.tiers?.length) return basePrice;

    const tier = this.props.tiers.find(t => quantity >= t.minQuantity && (!t.maxQuantity || quantity <= t.maxQuantity));

    if (!tier) return basePrice;
    return tier.price ?? basePrice * (1 - (tier.discountPercent || 0) / 100);
  }

  private calculateVolumePrice(basePrice: number, quantity: number): number {
    if (this.props.minQuantity && quantity < this.props.minQuantity) {
      return basePrice;
    }
    return basePrice * (1 - this.props.value / 100);
  }

  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      ruleId: this.props.ruleId,
      name: this.props.name,
      description: this.props.description,
      type: this.props.type,
      target: this.props.target,
      targetIds: this.props.targetIds,
      value: this.props.value,
      tiers: this.props.tiers,
      priority: this.props.priority,
      isActive: this.props.isActive,
      isCurrentlyActive: this.isCurrentlyActive,
      startDate: this.props.startDate?.toISOString(),
      endDate: this.props.endDate?.toISOString(),
      metadata: this.props.metadata,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
