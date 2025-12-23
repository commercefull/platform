/**
 * Coupon/Promotion Domain Model
 * Manages discount codes and promotional rules
 */

export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping';

export type CouponType = 'single_use' | 'multi_use' | 'unlimited';

export type CouponStatus = 'active' | 'inactive' | 'expired' | 'depleted';

export interface CouponCondition {
  type: 'min_order_value' | 'min_quantity' | 'product_category' | 'product_id' | 'customer_group' | 'first_order' | 'customer_email';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'contains';
  value: any;
}

export interface CouponUsage {
  usageId: string;
  couponId: string;
  orderId: string;
  customerId: string;
  discountAmount: number;
  usedAt: Date;
}

export interface CouponProps {
  couponId: string;
  code: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number; // Percentage (0-100) or fixed amount
  currency?: string; // Required for fixed_amount type
  minOrderValue?: number;
  maxDiscountAmount?: number; // Cap for percentage discounts
  usageType: CouponType;
  usageLimit?: number; // For multi_use type
  usageCount: number;
  customerUsageLimit?: number; // Max uses per customer
  conditions: CouponCondition[];
  isActive: boolean;
  startsAt?: Date;
  expiresAt?: Date;
  applicableProducts?: string[]; // Product IDs
  applicableCategories?: string[]; // Category IDs
  applicableCustomerGroups?: string[]; // Customer group IDs
  excludedProducts?: string[]; // Product IDs to exclude
  excludedCategories?: string[]; // Category IDs to exclude
  createdBy: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class Coupon {
  private props: CouponProps;

  private constructor(props: CouponProps) {
    this.props = props;
  }

  static create(props: {
    couponId: string;
    code: string;
    name: string;
    description?: string;
    type: DiscountType;
    value: number;
    currency?: string;
    minOrderValue?: number;
    maxDiscountAmount?: number;
    usageType: CouponType;
    usageLimit?: number;
    customerUsageLimit?: number;
    conditions?: CouponCondition[];
    startsAt?: Date;
    expiresAt?: Date;
    applicableProducts?: string[];
    applicableCategories?: string[];
    applicableCustomerGroups?: string[];
    excludedProducts?: string[];
    excludedCategories?: string[];
    createdBy: string;
    metadata?: Record<string, any>;
  }): Coupon {
    // Validate inputs
    if (!props.code?.trim()) {
      throw new Error('Coupon code is required');
    }

    if (props.type === 'percentage' && (props.value < 0 || props.value > 100)) {
      throw new Error('Percentage discount must be between 0 and 100');
    }

    if (props.type === 'fixed_amount' && !props.currency) {
      throw new Error('Currency is required for fixed amount discounts');
    }

    if (props.usageType === 'multi_use' && !props.usageLimit) {
      throw new Error('Usage limit is required for multi-use coupons');
    }

    const now = new Date();

    return new Coupon({
      couponId: props.couponId,
      code: props.code.toUpperCase().trim(),
      name: props.name,
      description: props.description,
      type: props.type,
      value: props.value,
      currency: props.currency,
      minOrderValue: props.minOrderValue,
      maxDiscountAmount: props.maxDiscountAmount,
      usageType: props.usageType,
      usageLimit: props.usageLimit,
      usageCount: 0,
      customerUsageLimit: props.customerUsageLimit,
      conditions: props.conditions || [],
      isActive: true,
      startsAt: props.startsAt,
      expiresAt: props.expiresAt,
      applicableProducts: props.applicableProducts,
      applicableCategories: props.applicableCategories,
      applicableCustomerGroups: props.applicableCustomerGroups,
      excludedProducts: props.excludedProducts,
      excludedCategories: props.excludedCategories,
      createdBy: props.createdBy,
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: CouponProps): Coupon {
    return new Coupon(props);
  }

  // Getters
  get couponId(): string {
    return this.props.couponId;
  }
  get code(): string {
    return this.props.code;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get type(): DiscountType {
    return this.props.type;
  }
  get value(): number {
    return this.props.value;
  }
  get currency(): string | undefined {
    return this.props.currency;
  }
  get minOrderValue(): number | undefined {
    return this.props.minOrderValue;
  }
  get maxDiscountAmount(): number | undefined {
    return this.props.maxDiscountAmount;
  }
  get usageType(): CouponType {
    return this.props.usageType;
  }
  get usageLimit(): number | undefined {
    return this.props.usageLimit;
  }
  get usageCount(): number {
    return this.props.usageCount;
  }
  get customerUsageLimit(): number | undefined {
    return this.props.customerUsageLimit;
  }
  get conditions(): CouponCondition[] {
    return [...this.props.conditions];
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get startsAt(): Date | undefined {
    return this.props.startsAt;
  }
  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }
  get applicableProducts(): string[] | undefined {
    return this.props.applicableProducts ? [...this.props.applicableProducts] : undefined;
  }
  get applicableCategories(): string[] | undefined {
    return this.props.applicableCategories ? [...this.props.applicableCategories] : undefined;
  }
  get applicableCustomerGroups(): string[] | undefined {
    return this.props.applicableCustomerGroups ? [...this.props.applicableCustomerGroups] : undefined;
  }
  get excludedProducts(): string[] | undefined {
    return this.props.excludedProducts ? [...this.props.excludedProducts] : undefined;
  }
  get excludedCategories(): string[] | undefined {
    return this.props.excludedCategories ? [...this.props.excludedCategories] : undefined;
  }
  get createdBy(): string {
    return this.props.createdBy;
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

  // Computed properties
  get status(): CouponStatus {
    if (!this.props.isActive) return 'inactive';
    if (this.isExpired) return 'expired';
    if (this.isDepleted) return 'depleted';
    if (!this.isStarted) return 'inactive';
    return 'active';
  }

  get isExpired(): boolean {
    return this.props.expiresAt ? this.props.expiresAt < new Date() : false;
  }

  get isStarted(): boolean {
    return this.props.startsAt ? this.props.startsAt <= new Date() : true;
  }

  get isDepleted(): boolean {
    if (this.props.usageType === 'unlimited') return false;
    if (this.props.usageType === 'single_use') return this.props.usageCount >= 1;
    return this.props.usageCount >= (this.props.usageLimit || 0);
  }

  get remainingUses(): number | undefined {
    if (this.props.usageType === 'unlimited') return undefined;
    if (this.props.usageType === 'single_use') return Math.max(0, 1 - this.props.usageCount);
    return Math.max(0, (this.props.usageLimit || 0) - this.props.usageCount);
  }

  // Domain methods
  updateBasicInfo(updates: { name?: string; description?: string; isActive?: boolean }): void {
    if (updates.name !== undefined) this.props.name = updates.name;
    if (updates.description !== undefined) this.props.description = updates.description;
    if (updates.isActive !== undefined) this.props.isActive = updates.isActive;
    this.touch();
  }

  updateDiscount(updates: {
    type?: DiscountType;
    value?: number;
    currency?: string;
    minOrderValue?: number;
    maxDiscountAmount?: number;
  }): void {
    if (updates.type !== undefined) this.props.type = updates.type;
    if (updates.value !== undefined) this.props.value = updates.value;
    if (updates.currency !== undefined) this.props.currency = updates.currency;
    if (updates.minOrderValue !== undefined) this.props.minOrderValue = updates.minOrderValue;
    if (updates.maxDiscountAmount !== undefined) this.props.maxDiscountAmount = updates.maxDiscountAmount;
    this.touch();
  }

  updateUsageRules(updates: { usageType?: CouponType; usageLimit?: number; customerUsageLimit?: number }): void {
    if (updates.usageType !== undefined) this.props.usageType = updates.usageType;
    if (updates.usageLimit !== undefined) this.props.usageLimit = updates.usageLimit;
    if (updates.customerUsageLimit !== undefined) this.props.customerUsageLimit = updates.customerUsageLimit;
    this.touch();
  }

  updateValidity(updates: { startsAt?: Date; expiresAt?: Date }): void {
    if (updates.startsAt !== undefined) this.props.startsAt = updates.startsAt;
    if (updates.expiresAt !== undefined) this.props.expiresAt = updates.expiresAt;
    this.touch();
  }

  updateApplicability(updates: {
    applicableProducts?: string[];
    applicableCategories?: string[];
    applicableCustomerGroups?: string[];
    excludedProducts?: string[];
    excludedCategories?: string[];
  }): void {
    if (updates.applicableProducts !== undefined) this.props.applicableProducts = updates.applicableProducts;
    if (updates.applicableCategories !== undefined) this.props.applicableCategories = updates.applicableCategories;
    if (updates.applicableCustomerGroups !== undefined) this.props.applicableCustomerGroups = updates.applicableCustomerGroups;
    if (updates.excludedProducts !== undefined) this.props.excludedProducts = updates.excludedProducts;
    if (updates.excludedCategories !== undefined) this.props.excludedCategories = updates.excludedCategories;
    this.touch();
  }

  addCondition(condition: CouponCondition): void {
    this.props.conditions.push(condition);
    this.touch();
  }

  removeCondition(index: number): void {
    if (index >= 0 && index < this.props.conditions.length) {
      this.props.conditions.splice(index, 1);
      this.touch();
    }
  }

  canBeApplied(orderValue: number, customerId?: string, customerGroupIds?: string[]): boolean {
    if (this.status !== 'active') return false;

    // Check minimum order value
    if (this.props.minOrderValue && orderValue < this.props.minOrderValue) {
      return false;
    }

    // Check customer usage limit
    if (customerId && this.props.customerUsageLimit) {
      // This would need to check usage history - simplified for now
      // In real implementation, check coupon usage repository
    }

    return true;
  }

  calculateDiscount(orderValue: number, productValue?: number): number {
    let discountAmount = 0;

    if (this.props.type === 'percentage') {
      const targetValue = productValue || orderValue;
      discountAmount = (targetValue * this.props.value) / 100;
    } else if (this.props.type === 'fixed_amount') {
      discountAmount = this.props.value;
    } else if (this.props.type === 'free_shipping') {
      // Free shipping is handled separately in shipping calculation
      discountAmount = 0;
    }

    // Apply maximum discount cap
    if (this.props.maxDiscountAmount && discountAmount > this.props.maxDiscountAmount) {
      discountAmount = this.props.maxDiscountAmount;
    }

    return Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
  }

  recordUsage(orderId: string, customerId: string, discountAmount: number): CouponUsage {
    this.props.usageCount++;
    this.touch();

    return {
      usageId: generateUUID(),
      couponId: this.props.couponId,
      orderId,
      customerId,
      discountAmount,
      usedAt: new Date(),
    };
  }

  updateMetadata(metadata: Record<string, any>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      couponId: this.props.couponId,
      code: this.props.code,
      name: this.props.name,
      description: this.props.description,
      type: this.props.type,
      value: this.props.value,
      currency: this.props.currency,
      minOrderValue: this.props.minOrderValue,
      maxDiscountAmount: this.props.maxDiscountAmount,
      usageType: this.props.usageType,
      usageLimit: this.props.usageLimit,
      usageCount: this.props.usageCount,
      customerUsageLimit: this.props.customerUsageLimit,
      conditions: this.props.conditions,
      isActive: this.props.isActive,
      status: this.status,
      startsAt: this.props.startsAt?.toISOString(),
      expiresAt: this.props.expiresAt?.toISOString(),
      applicableProducts: this.props.applicableProducts,
      applicableCategories: this.props.applicableCategories,
      applicableCustomerGroups: this.props.applicableCustomerGroups,
      excludedProducts: this.props.excludedProducts,
      excludedCategories: this.props.excludedCategories,
      createdBy: this.props.createdBy,
      metadata: this.props.metadata,
      remainingUses: this.remainingUses,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}

// Helper function (should be imported from uuid lib)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
