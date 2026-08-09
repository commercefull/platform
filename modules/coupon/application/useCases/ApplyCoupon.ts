/**
 * ApplyCoupon Use Case
 */

import { Coupon } from '../../domain/entities/Coupon';

export interface CouponRepositoryPort {
  findByCode(code: string): Promise<Coupon | null>;
  getCustomerUsageCount(couponId: string, customerId: string): Promise<number>;
  recordUsage(usage: {
    couponId: string;
    basketId: string;
    customerId?: string;
    discountAmount: number;
  }): Promise<unknown>;
}

export interface ApplyCouponInput {
  couponCode: string;
  basketId: string;
  customerId?: string;
  orderTotal: number;
  items?: Array<{
    productId: string;
    categoryId?: string;
    quantity: number;
    price: number;
  }>;
}

export interface ApplyCouponOutput {
  applied: boolean;
  discountAmount: number;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  message?: string;
  newTotal: number;
}

export class ApplyCouponUseCase {
  constructor(private readonly couponRepository: CouponRepositoryPort) {}

  async execute(input: ApplyCouponInput): Promise<ApplyCouponOutput> {
    const coupon = await this.couponRepository.findByCode(input.couponCode);
    if (!coupon) {
      return {
        applied: false,
        discountAmount: 0,
        discountType: 'fixed',
        message: 'Invalid coupon code',
        newTotal: input.orderTotal,
      };
    }

    // Validate coupon
    const validation = await this.validateCoupon(coupon, input);
    if (!validation.valid) {
      return {
        applied: false,
        discountAmount: 0,
        discountType: coupon.type as 'percentage' | 'fixed' | 'free_shipping',
        message: validation.message,
        newTotal: input.orderTotal,
      };
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = input.orderTotal * (coupon.value / 100);
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else if (coupon.type === 'fixed_amount') {
      discountAmount = Math.min(coupon.value, input.orderTotal);
    } else if (coupon.type === 'free_shipping') {
      // Free shipping handled separately
      discountAmount = 0;
    }

    // Track usage
    await this.couponRepository.recordUsage({
      couponId: coupon.couponId,
      basketId: input.basketId,
      customerId: input.customerId,
      discountAmount,
    });

    return {
      applied: true,
      discountAmount,
      discountType: coupon.type as 'percentage' | 'fixed' | 'free_shipping',
      newTotal: input.orderTotal - discountAmount,
    };
  }

  private async validateCoupon(coupon: Coupon, input: ApplyCouponInput): Promise<{ valid: boolean; message?: string }> {
    const now = new Date();

    if (!coupon.isActive) {
      return { valid: false, message: 'Coupon is not active' };
    }

    if (coupon.startsAt && now < coupon.startsAt) {
      return { valid: false, message: 'Coupon is not yet valid' };
    }

    if (coupon.expiresAt && now > coupon.expiresAt) {
      return { valid: false, message: 'Coupon has expired' };
    }

    if (coupon.minOrderValue && input.orderTotal < coupon.minOrderValue) {
      return { valid: false, message: `Minimum order amount is ${coupon.minOrderValue}` };
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, message: 'Coupon has reached maximum usage' };
    }

    if (input.customerId && coupon.customerUsageLimit) {
      const customerUsage = await this.couponRepository.getCustomerUsageCount(coupon.couponId, input.customerId);
      if (customerUsage >= coupon.customerUsageLimit) {
        return { valid: false, message: 'You have already used this coupon' };
      }
    }

    return { valid: true };
  }
}
