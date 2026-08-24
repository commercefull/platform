/**
 * Consolidated Coupon & Discount Repository
 *
 * Merges couponRepo and discountRepo into a single aggregate-aligned repository.
 *
 * Aggregate: Coupon/Discount (coupons, coupon usage, product discounts, discount items)
 */

import couponRepo from './couponRepo';
import discountRepo from './discountRepo';

// Re-export types for backward compatibility
export type {
  CouponType,
  CouponGenerationMethod,
  PromotionCoupon,
  PromotionCouponUsage,
  CreateCouponInput,
  UpdateCouponInput,
  CouponValidationResult,
} from './couponRepo';
export type {
  DiscountType,
  AppliesTo,
  CreateProductDiscountInput,
  UpdateProductDiscountInput,
  CreateDiscountItemInput,
} from './discountRepo';

class CouponDiscountRepository {
  readonly coupons = couponRepo;
  readonly discounts = discountRepo;
}

export default new CouponDiscountRepository();
