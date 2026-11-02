/**
 * Create Coupon Use Case
 */

import { generateUUID } from '../../../../libs/uuid';
import { Coupon } from '../../domain/entities/Coupon';
import { CouponRepository } from '../../domain/repositories/CouponRepository';
import { CouponCodeAlreadyExistsError } from '../../domain/errors/CouponErrors';
export interface CreateCouponCommandProps {
  code: string;
  name: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  createdBy: string;
  description?: string;
  currency?: string;
  minOrderValueCents?: number;
  maxDiscountAmountCents?: number;
  usageType?: 'single_use' | 'multi_use' | 'unlimited';
  usageLimit?: number;
  customerUsageLimit?: number;
  startsAt?: Date;
  expiresAt?: Date;
  applicableProducts?: string[];
  applicableCategories?: string[];
  applicableCustomerGroups?: string[];
  excludedProducts?: string[];
  excludedCategories?: string[];
  metadata?: Record<string, unknown>;
}

export class CreateCouponCommand {
  public readonly code: string;
  public readonly name: string;
  public readonly type: 'percentage' | 'fixed_amount' | 'free_shipping';
  public readonly value: number;
  public readonly createdBy: string;
  public readonly description?: string;
  public readonly currency?: string;
  public readonly minOrderValueCents?: number;
  public readonly maxDiscountAmountCents?: number;
  public readonly usageType?: 'single_use' | 'multi_use' | 'unlimited';
  public readonly usageLimit?: number;
  public readonly customerUsageLimit?: number;
  public readonly startsAt?: Date;
  public readonly expiresAt?: Date;
  public readonly applicableProducts?: string[];
  public readonly applicableCategories?: string[];
  public readonly applicableCustomerGroups?: string[];
  public readonly excludedProducts?: string[];
  public readonly excludedCategories?: string[];
  public readonly metadata?: Record<string, unknown>;

  constructor(props: CreateCouponCommandProps) {
    this.code = props.code;
    this.name = props.name;
    this.type = props.type;
    this.value = props.value;
    this.createdBy = props.createdBy;
    this.description = props.description;
    this.currency = props.currency;
    this.minOrderValueCents = props.minOrderValueCents;
    this.maxDiscountAmountCents = props.maxDiscountAmountCents;
    this.usageType = props.usageType;
    this.usageLimit = props.usageLimit;
    this.customerUsageLimit = props.customerUsageLimit;
    this.startsAt = props.startsAt;
    this.expiresAt = props.expiresAt;
    this.applicableProducts = props.applicableProducts;
    this.applicableCategories = props.applicableCategories;
    this.applicableCustomerGroups = props.applicableCustomerGroups;
    this.excludedProducts = props.excludedProducts;
    this.excludedCategories = props.excludedCategories;
    this.metadata = props.metadata;
  }
}

export class CreateCouponUseCase {
  constructor(private readonly couponRepository: CouponRepository) {}

  async execute(command: CreateCouponCommand): Promise<Coupon> {
    // Check if code already exists
    const existing = await this.couponRepository.findByCode(command.code);
    if (existing) {
      throw new CouponCodeAlreadyExistsError(command.code);
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
      minOrderValueCents: command.minOrderValueCents,
      maxDiscountAmountCents: command.maxDiscountAmountCents,
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
