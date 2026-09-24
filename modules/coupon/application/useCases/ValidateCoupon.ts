/**
 * Validate Coupon Use Case
 */

import { CouponRepository } from '../../domain/repositories/CouponRepository';

export class ValidateCouponCommand {
  constructor(
    public readonly code: string,
    public readonly orderValueCents: number,
    public readonly customerId?: string,
    public readonly items?: Array<{
      productId: string;
      categoryId?: string;
      quantity: number;
      priceCents: number;
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
    discountAmountCents: number;
  };
  error?: string;
  applicableItems?: Array<{
    productId: string;
    discountAmountCents: number;
  }>;
}

export class ValidateCouponUseCase {
  constructor(private readonly couponRepository: CouponRepository) {}

  async execute(command: ValidateCouponCommand): Promise<CouponValidationResult> {
    const validation = await this.couponRepository.validateCouponCode(command.code, command.orderValueCents, command.customerId);

    if (!validation.valid || !validation.coupon) {
      return {
        valid: false,
        error: validation.error || 'Invalid coupon',
      };
    }

    const coupon = validation.coupon;
    const discountAmountCents = validation.discountAmountCents || 0;

    // Calculate item-level discounts if applicable
    let applicableItems: Array<{ productId: string; discountAmountCents: number }> | undefined;

    if (command.items && coupon.applicableProducts) {
      applicableItems = [];
      const applicableProductIds = new Set(coupon.applicableProducts);

      for (const item of command.items) {
        if (applicableProductIds.has(item.productId)) {
          const itemDiscount = coupon.calculateDiscount(item.priceCents * item.quantity, item.priceCents * item.quantity);
          applicableItems.push({
            productId: item.productId,
            discountAmountCents: itemDiscount,
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
        discountAmountCents,
      },
      applicableItems,
    };
  }
}
