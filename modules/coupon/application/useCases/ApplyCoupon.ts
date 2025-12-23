/**
 * ApplyCoupon Use Case
 */

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
  constructor(private readonly couponRepository: any) {}

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
        discountType: coupon.type,
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
    } else if (coupon.type === 'fixed') {
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
      discountType: coupon.type,
      newTotal: input.orderTotal - discountAmount,
    };
  }

  private async validateCoupon(coupon: any, input: ApplyCouponInput): Promise<{ valid: boolean; message?: string }> {
    const now = new Date();

    if (!coupon.isActive) {
      return { valid: false, message: 'Coupon is not active' };
    }

    if (coupon.validFrom && now < new Date(coupon.validFrom)) {
      return { valid: false, message: 'Coupon is not yet valid' };
    }

    if (coupon.validTo && now > new Date(coupon.validTo)) {
      return { valid: false, message: 'Coupon has expired' };
    }

    if (coupon.minOrderAmount && input.orderTotal < coupon.minOrderAmount) {
      return { valid: false, message: `Minimum order amount is ${coupon.minOrderAmount}` };
    }

    if (coupon.maxUsage && coupon.currentUsageCount >= coupon.maxUsage) {
      return { valid: false, message: 'Coupon has reached maximum usage' };
    }

    if (input.customerId && coupon.maxUsagePerCustomer) {
      const customerUsage = await this.couponRepository.getCustomerUsageCount(coupon.couponId, input.customerId);
      if (customerUsage >= coupon.maxUsagePerCustomer) {
        return { valid: false, message: 'You have already used this coupon' };
      }
    }

    return { valid: true };
  }
}
