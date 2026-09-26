/**
 * Validate Coupon Code Use Case
 * Validates request input and delegates coupon eligibility checks
 * to the repository's domain validation.
 */

import type { CouponRepository, CouponValidationResult } from '../../domain/repositories/CouponRepository';
import { PromotionValidationError } from '../../domain/errors/PromotionErrors';

export type ValidateCouponCodePort = Pick<CouponRepository, 'validate'>;

export interface ValidateCouponCodeCommand {
  code: string;
  orderTotalCents: string;
  customerId?: string;
  organizationId?: string;
}

export class ValidateCouponCodeUseCase {
  constructor(private readonly coupons: ValidateCouponCodePort) {}

  async execute(command: ValidateCouponCodeCommand): Promise<CouponValidationResult> {
    if (!command.code || command.orderTotalCents === undefined) {
      throw new PromotionValidationError('Coupon code and order total are required');
    }

    return this.coupons.validate(
      command.code,
      parseFloat(command.orderTotalCents),
      command.customerId,
      command.organizationId,
    );
  }
}
