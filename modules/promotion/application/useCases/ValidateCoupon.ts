/**
 * Validate Coupon Use Case
 * Validates a coupon code for a given order
 */

import type { PromotionCoupon, CouponRepository } from '../../domain/repositories/CouponRepository';

// ============================================================================
// Command
// ============================================================================

export class ValidateCouponCommand {
  constructor(
    public readonly code: string,
    public readonly orderTotalCents: number,
    public readonly customerId?: string,
    public readonly organizationId?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface ValidateCouponResponse {
  valid: boolean;
  coupon?: PromotionCoupon;
  discountAmountCents?: number;
  message?: string;
  errors?: string[];
}

// ============================================================================
// Use Case
// ============================================================================

export class ValidateCouponUseCase {
  constructor(private readonly couponRepo: Pick<CouponRepository, 'findByCode' | 'getCustomerUsageCount' | 'calculateDiscount'>) {}

  async execute(command: ValidateCouponCommand): Promise<ValidateCouponResponse> {
    const _errors: string[] = [];

    // Validate input
    if (!command.code?.trim()) {
      return { valid: false, message: 'Coupon code is required', errors: ['code_required'] };
    }

    if (command.orderTotalCents < 0) {
      return { valid: false, message: 'Order total must be positive', errors: ['invalid_order_total'] };
    }

    // Find coupon by code
    const coupon = await this.couponRepo.findByCode(command.code.toUpperCase(), command.organizationId);

    if (!coupon) {
      return { valid: false, message: 'Coupon not found', errors: ['coupon_not_found'] };
    }

    const eligibilityError = await this.checkEligibility(command, coupon);
    if (eligibilityError) {
      return eligibilityError;
    }

    // Calculate discount
    const discountAmountCents = this.couponRepo.calculateDiscount(coupon, command.orderTotalCents);

    return {
      valid: true,
      coupon,
      discountAmountCents,
      message: 'Coupon is valid',
    };
  }

  /**
   * Returns an invalid response describing the first failed eligibility check,
   * or null when the coupon may be applied.
   */
  private async checkEligibility(command: ValidateCouponCommand, coupon: PromotionCoupon): Promise<ValidateCouponResponse | null> {
    if (!coupon.isActive) {
      return { valid: false, message: 'Coupon is not active', errors: ['coupon_inactive'] };
    }

    const now = new Date();
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      return { valid: false, message: 'Coupon is not yet valid', errors: ['coupon_not_started'] };
    }

    if (coupon.endDate && new Date(coupon.endDate) < now) {
      return { valid: false, message: 'Coupon has expired', errors: ['coupon_expired'] };
    }

    if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
      return { valid: false, message: 'Coupon usage limit reached', errors: ['usage_limit_reached'] };
    }

    if (coupon.minOrderAmountCents && command.orderTotalCents < Number(coupon.minOrderAmountCents)) {
      return {
        valid: false,
        message: `Minimum order amount of ${coupon.minOrderAmountCents} cents required`,
        errors: ['min_order_not_met'],
      };
    }

    return this.checkCustomerUsage(command, coupon);
  }

  private async checkCustomerUsage(command: ValidateCouponCommand, coupon: PromotionCoupon): Promise<ValidateCouponResponse | null> {
    if (!command.customerId || !coupon.maxUsagePerCustomer) {
      return null;
    }

    const customerUsage = await this.couponRepo.getCustomerUsageCount(coupon.promotionCouponId, command.customerId);

    if (customerUsage >= coupon.maxUsagePerCustomer) {
      return {
        valid: false,
        message: 'You have reached the usage limit for this coupon',
        errors: ['customer_usage_limit_reached'],
      };
    }

    return null;
  }
}
