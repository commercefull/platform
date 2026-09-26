/**
 * Create Coupon Use Case
 * Validates input and uniqueness, then creates a coupon.
 */

import type { CouponRepository, CreateCouponInput, PromotionCoupon } from '../../domain/repositories/CouponRepository';
import { PromotionValidationError } from '../../domain/errors/PromotionErrors';

export type CreateCouponPort = Pick<CouponRepository, 'findByCode' | 'create'>;

export class CreateCouponUseCase {
  constructor(private readonly coupons: CreateCouponPort) {}

  async execute(input: CreateCouponInput): Promise<PromotionCoupon> {
    if (!input.code || !input.name || !input.type) {
      throw new PromotionValidationError('Missing required fields: code, name, and type are required');
    }

    const existing = await this.coupons.findByCode(input.code, input.organizationId);
    if (existing) {
      throw new PromotionValidationError('Coupon code already exists');
    }

    return this.coupons.create(input);
  }
}
