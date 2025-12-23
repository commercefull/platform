/**
 * Create Coupon Use Case
 */

import { generateUUID } from '../../../../libs/uuid';
import { Coupon } from '../../domain/entities/Coupon';
import { CouponRepository } from '../../infrastructure/repositories/CouponRepository';

export class CreateCouponCommand {
  constructor(
    public readonly code: string,
    public readonly name: string,
    public readonly type: 'percentage' | 'fixed_amount' | 'free_shipping',
    public readonly value: number,
    public readonly createdBy: string,
    public readonly description?: string,
    public readonly currency?: string,
    public readonly minOrderValue?: number,
    public readonly maxDiscountAmount?: number,
    public readonly usageType?: 'single_use' | 'multi_use' | 'unlimited',
    public readonly usageLimit?: number,
    public readonly customerUsageLimit?: number,
    public readonly startsAt?: Date,
    public readonly expiresAt?: Date,
    public readonly applicableProducts?: string[],
    public readonly applicableCategories?: string[],
    public readonly applicableCustomerGroups?: string[],
    public readonly excludedProducts?: string[],
    public readonly excludedCategories?: string[],
    public readonly metadata?: Record<string, any>,
  ) {}
}

export class CreateCouponUseCase {
  constructor(private readonly couponRepository: CouponRepository) {}

  async execute(command: CreateCouponCommand): Promise<Coupon> {
    // Check if code already exists
    const existing = await this.couponRepository.findByCode(command.code);
    if (existing) {
      throw new Error('Coupon code already exists');
    }

    const couponId = generateUUID();

    const coupon = Coupon.create({
      couponId,
      code: command.code,
      name: command.name,
      type: command.type,
      value: command.value,
      createdBy: command.createdBy,
      description: command.description,
      currency: command.currency,
      minOrderValue: command.minOrderValue,
      maxDiscountAmount: command.maxDiscountAmount,
      usageType: command.usageType || 'single_use',
      usageLimit: command.usageLimit,
      customerUsageLimit: command.customerUsageLimit,
      startsAt: command.startsAt,
      expiresAt: command.expiresAt,
      applicableProducts: command.applicableProducts,
      applicableCategories: command.applicableCategories,
      applicableCustomerGroups: command.applicableCustomerGroups,
      excludedProducts: command.excludedProducts,
      excludedCategories: command.excludedCategories,
      metadata: command.metadata,
    });

    return await this.couponRepository.save(coupon);
  }
}
