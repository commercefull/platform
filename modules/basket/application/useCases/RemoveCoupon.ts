/**
 * Remove Coupon Use Case
 */

import { BasketRepository } from '../../domain/repositories/BasketRepository';
import { BasketNotFoundError } from '../../domain/errors/BasketErrors';
import { eventBus } from '../../../../libs/events/eventBus';

export class RemoveCouponCommand {
  constructor(public readonly basketId: string) {}
}

export class RemoveCouponUseCase {
  constructor(private readonly repository: BasketRepository) {}

  async execute(command: RemoveCouponCommand): Promise<Record<string, unknown>> {
    const basket = await this.repository.findById(command.basketId);
    if (!basket) {
      throw new BasketNotFoundError(command.basketId);
    }

    const couponCode = basket.coupon?.couponCode;

    basket.removeCoupon();
    await this.repository.save(basket);

    eventBus.emit('promotion.coupon_removed', {
      basketId: basket.basketId,
      couponCode,
    });

    return basket.toJSON();
  }
}
