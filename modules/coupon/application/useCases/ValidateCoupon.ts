/**
 * Validate Coupon Use Case
 */

import { CouponRepository } from '../../infrastructure/repositories/CouponRepository';

export class ValidateCouponCommand {
  constructor(
    public readonly code: string,
    public readonly orderValue: number,
    public readonly customerId?: string,
    public readonly items?: Array<{
      productId: string;
      categoryId?: string;
      quantity: number;
      price: number;
    }>,
  ) {}
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: {
    couponId: string;
    code: string;
    name: string;
    type: string;
    value: number;
    discountAmount: number;
  };
  error?: string;
  applicableItems?: Array<{
    productId: string;
    discountAmount: number;
  }>;
}

export class ValidateCouponUseCase {
  constructor(private readonly couponRepository: CouponRepository) {}

  async execute(command: ValidateCouponCommand): Promise<CouponValidationResult> {
    const validation = await this.couponRepository.validateCouponCode(command.code, command.orderValue, command.customerId);

    if (!validation.valid || !validation.coupon) {
      return {
        valid: false,
        error: validation.error || 'Invalid coupon',
      };
    }

    const coupon = validation.coupon;
    const discountAmount = validation.discountAmount || 0;

    // Calculate item-level discounts if applicable
    let applicableItems: Array<{ productId: string; discountAmount: number }> | undefined;

    if (command.items && coupon.applicableProducts) {
      applicableItems = [];
      const applicableProductIds = new Set(coupon.applicableProducts);

      for (const item of command.items) {
        if (applicableProductIds.has(item.productId)) {
          const itemDiscount = coupon.calculateDiscount(item.price * item.quantity, item.price * item.quantity);
          applicableItems.push({
            productId: item.productId,
            discountAmount: itemDiscount,
          });
        }
      }
    }

    return {
      valid: true,
      coupon: {
        couponId: coupon.couponId,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        discountAmount,
      },
      applicableItems,
    };
  }
}
