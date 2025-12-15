/**
 * Validate Coupon Use Case
 * Validates a coupon code for a given order
 */

import couponRepo, { PromotionCoupon } from '../../repos/couponRepo';

// ============================================================================
// Command
// ============================================================================

export class ValidateCouponCommand {
  constructor(
    public readonly code: string,
    public readonly orderTotal: number,
    public readonly customerId?: string,
    public readonly merchantId?: string
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface ValidateCouponResponse {
  valid: boolean;
  coupon?: PromotionCoupon;
  discountAmount?: number;
  message?: string;
  errors?: string[];
}

// ============================================================================
// Use Case
// ============================================================================

export class ValidateCouponUseCase {
  async execute(command: ValidateCouponCommand): Promise<ValidateCouponResponse> {
    const errors: string[] = [];

    // Validate input
    if (!command.code?.trim()) {
      return { valid: false, message: 'Coupon code is required', errors: ['code_required'] };
    }

    if (command.orderTotal < 0) {
      return { valid: false, message: 'Order total must be positive', errors: ['invalid_order_total'] };
    }

    // Find coupon by code
    const coupon = await couponRepo.findByCode(command.code.toUpperCase(), command.merchantId);
    
    if (!coupon) {
      return { valid: false, message: 'Coupon not found', errors: ['coupon_not_found'] };
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return { valid: false, message: 'Coupon is not active', errors: ['coupon_inactive'] };
    }

    // Check date validity
    const now = new Date();
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      return { valid: false, message: 'Coupon is not yet valid', errors: ['coupon_not_started'] };
    }

    if (coupon.endDate && new Date(coupon.endDate) < now) {
      return { valid: false, message: 'Coupon has expired', errors: ['coupon_expired'] };
    }

    // Check usage limits
    if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
      return { valid: false, message: 'Coupon usage limit reached', errors: ['usage_limit_reached'] };
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && command.orderTotal < Number(coupon.minOrderAmount)) {
      return { 
        valid: false, 
        message: `Minimum order amount of ${coupon.minOrderAmount} required`, 
        errors: ['min_order_not_met'] 
      };
    }

    // Check per-customer usage if customerId provided
    if (command.customerId && coupon.maxUsagePerCustomer) {
      const customerUsage = await couponRepo.getCustomerUsageCount(
        coupon.promotionCouponId, 
        command.customerId
      );
      
      if (customerUsage >= coupon.maxUsagePerCustomer) {
        return { 
          valid: false, 
          message: 'You have reached the usage limit for this coupon', 
          errors: ['customer_usage_limit_reached'] 
        };
      }
    }

    // Calculate discount
    const discountAmount = couponRepo.calculateDiscount(coupon, command.orderTotal);

    return {
      valid: true,
      coupon,
      discountAmount,
      message: 'Coupon is valid'
    };
  }
}

export const validateCouponUseCase = new ValidateCouponUseCase();
