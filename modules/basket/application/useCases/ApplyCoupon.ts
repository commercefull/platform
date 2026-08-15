/**
 * Apply Coupon Use Case
 */

import { BasketRepository } from '../../domain/repositories/BasketRepository';
import { CouponRepository } from '../../../coupon/infrastructure/repositories/CouponRepository';
import { eventBus } from '../../../../libs/events/eventBus';

export class ApplyCouponCommand {
  constructor(
    public readonly basketId: string,
    public readonly couponCode: string,
  ) {}
}

export class ApplyCouponUseCase {
  constructor(private readonly repository: BasketRepository) {}

  async execute(command: ApplyCouponCommand): Promise<Record<string, unknown>> {
    const basket = await this.repository.findById(command.basketId);
    if (!basket) {
      throw new Error('Basket not found');
    }

    const couponRepo = new CouponRepository();
    const validation = await couponRepo.validateCouponCode(command.couponCode, basket.subtotal.amount, basket.customerId);

    if (!validation.valid || !validation.coupon) {
      throw new Error(validation.error || `Invalid coupon code: ${command.couponCode}`);
    }

    const coupon = validation.coupon;
    const discountType = coupon.type === 'fixed_amount' ? 'fixed' : 'percentage';
    const discountValue = coupon.value;

    basket.applyCoupon(command.couponCode, discountType, discountValue);
    await this.repository.save(basket);

    eventBus.emit('promotion.coupon_applied', {
      basketId: basket.basketId,
      couponCode: command.couponCode,
      discountType,
      discountValue,
      discountAmount: validation.discountAmount,
    });

    return basket.toJSON();
  }
}
