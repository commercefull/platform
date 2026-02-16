/**
 * Apply Coupon Use Case
 */

import { BasketRepository } from '../../domain/repositories/BasketRepository';
import { eventBus } from '../../../../libs/events/eventBus';

export class ApplyCouponCommand {
  constructor(
    public readonly basketId: string,
    public readonly couponCode: string,
    public readonly discountType: 'percentage' | 'fixed',
    public readonly discountValue: number,
  ) {}
}

export class ApplyCouponUseCase {
  constructor(private readonly repository: BasketRepository) {}

  async execute(command: ApplyCouponCommand): Promise<any> {
    const basket = await this.repository.findById(command.basketId);
    if (!basket) {
      throw new Error('Basket not found');
    }

    basket.applyCoupon(command.couponCode, command.discountType, command.discountValue);
    await this.repository.save(basket);

    eventBus.emit('promotion.coupon_applied', {
      basketId: basket.basketId,
      couponCode: command.couponCode,
      discountType: command.discountType,
      discountValue: command.discountValue,
    });

    return basket.toJSON();
  }
}
