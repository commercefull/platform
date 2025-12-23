/**
 * Promotion Aggregate Root
 */

export type PromotionType = 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_shipping' | 'bundle';
export type PromotionStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'expired' | 'cancelled';

export interface PromotionCondition {
  type: 'min_purchase' | 'min_items' | 'specific_products' | 'specific_categories' | 'customer_group' | 'first_order';
  value: any;
}

export interface PromotionProps {
  promotionId: string;
  name: string;
  description?: string;
  code?: string;
  type: PromotionType;
  value: number;
  maxDiscount?: number;
  minPurchase?: number;
  status: PromotionStatus;
  conditions: PromotionCondition[];
  applicableProducts?: string[];
  applicableCategories?: string[];
  excludedProducts?: string[];
  startDate: Date;
  endDate?: Date;
  usageLimit?: number;
  usageCount: number;
  perCustomerLimit?: number;
  stackable: boolean;
  priority: number;
  merchantId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class Promotion {
  private props: PromotionProps;

  private constructor(props: PromotionProps) {
    this.props = props;
  }

  static create(props: {
    promotionId: string;
    name: string;
    description?: string;
    code?: string;
    type: PromotionType;
    value: number;
    maxDiscount?: number;
    minPurchase?: number;
    conditions?: PromotionCondition[];
    applicableProducts?: string[];
    applicableCategories?: string[];
    startDate: Date;
    endDate?: Date;
    usageLimit?: number;
    perCustomerLimit?: number;
    stackable?: boolean;
    priority?: number;
    merchantId?: string;
    metadata?: Record<string, any>;
  }): Promotion {
    const now = new Date();
    return new Promotion({
      promotionId: props.promotionId,
      name: props.name,
      description: props.description,
      code: props.code?.toUpperCase(),
      type: props.type,
      value: props.value,
      maxDiscount: props.maxDiscount,
      minPurchase: props.minPurchase,
      status: props.startDate <= now ? 'active' : 'scheduled',
      conditions: props.conditions || [],
      applicableProducts: props.applicableProducts,
      applicableCategories: props.applicableCategories,
      startDate: props.startDate,
      endDate: props.endDate,
      usageLimit: props.usageLimit,
      usageCount: 0,
      perCustomerLimit: props.perCustomerLimit,
      stackable: props.stackable ?? false,
      priority: props.priority ?? 0,
      merchantId: props.merchantId,
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: PromotionProps): Promotion {
    return new Promotion(props);
  }

  // Getters
  get promotionId(): string {
    return this.props.promotionId;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get code(): string | undefined {
    return this.props.code;
  }
  get type(): PromotionType {
    return this.props.type;
  }
  get value(): number {
    return this.props.value;
  }
  get maxDiscount(): number | undefined {
    return this.props.maxDiscount;
  }
  get minPurchase(): number | undefined {
    return this.props.minPurchase;
  }
  get status(): PromotionStatus {
    return this.props.status;
  }
  get conditions(): PromotionCondition[] {
    return [...this.props.conditions];
  }
  get applicableProducts(): string[] | undefined {
    return this.props.applicableProducts;
  }
  get applicableCategories(): string[] | undefined {
    return this.props.applicableCategories;
  }
  get startDate(): Date {
    return this.props.startDate;
  }
  get endDate(): Date | undefined {
    return this.props.endDate;
  }
  get usageLimit(): number | undefined {
    return this.props.usageLimit;
  }
  get usageCount(): number {
    return this.props.usageCount;
  }
  get perCustomerLimit(): number | undefined {
    return this.props.perCustomerLimit;
  }
  get stackable(): boolean {
    return this.props.stackable;
  }
  get priority(): number {
    return this.props.priority;
  }
  get merchantId(): string | undefined {
    return this.props.merchantId;
  }
  get metadata(): Record<string, any> | undefined {
    return this.props.metadata;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Computed
  get isActive(): boolean {
    return this.props.status === 'active';
  }
  get isExpired(): boolean {
    return this.props.endDate ? this.props.endDate < new Date() : false;
  }
  get hasUsageLimit(): boolean {
    return this.props.usageLimit !== undefined && this.props.usageLimit > 0;
  }
  get remainingUses(): number | undefined {
    if (!this.hasUsageLimit) return undefined;
    return Math.max(0, (this.props.usageLimit || 0) - this.props.usageCount);
  }
  get isUsageLimitReached(): boolean {
    if (!this.hasUsageLimit) return false;
    return this.props.usageCount >= (this.props.usageLimit || 0);
  }

  // Domain methods
  calculateDiscount(subtotal: number): number {
    if (!this.isApplicable(subtotal)) return 0;

    let discount = 0;
    switch (this.props.type) {
      case 'percentage':
        discount = subtotal * (this.props.value / 100);
        break;
      case 'fixed_amount':
        discount = this.props.value;
        break;
      case 'free_shipping':
        return 0; // Handled separately
      default:
        discount = 0;
    }

    if (this.props.maxDiscount) {
      discount = Math.min(discount, this.props.maxDiscount);
    }

    return Math.min(discount, subtotal);
  }

  isApplicable(subtotal: number): boolean {
    if (!this.isActive) return false;
    if (this.isExpired) return false;
    if (this.isUsageLimitReached) return false;
    if (this.props.minPurchase && subtotal < this.props.minPurchase) return false;
    return true;
  }

  incrementUsage(): void {
    this.props.usageCount += 1;
    this.touch();
  }

  activate(): void {
    this.props.status = 'active';
    this.touch();
  }

  pause(): void {
    this.props.status = 'paused';
    this.touch();
  }

  cancel(): void {
    this.props.status = 'cancelled';
    this.touch();
  }

  extend(newEndDate: Date): void {
    this.props.endDate = newEndDate;
    if (this.props.status === 'expired') {
      this.props.status = 'active';
    }
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      promotionId: this.props.promotionId,
      name: this.props.name,
      description: this.props.description,
      code: this.props.code,
      type: this.props.type,
      value: this.props.value,
      maxDiscount: this.props.maxDiscount,
      minPurchase: this.props.minPurchase,
      status: this.props.status,
      isActive: this.isActive,
      conditions: this.props.conditions,
      applicableProducts: this.props.applicableProducts,
      applicableCategories: this.props.applicableCategories,
      startDate: this.props.startDate.toISOString(),
      endDate: this.props.endDate?.toISOString(),
      usageLimit: this.props.usageLimit,
      usageCount: this.props.usageCount,
      remainingUses: this.remainingUses,
      perCustomerLimit: this.props.perCustomerLimit,
      stackable: this.props.stackable,
      priority: this.props.priority,
      metadata: this.props.metadata,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
