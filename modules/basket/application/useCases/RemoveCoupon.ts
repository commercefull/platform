/**
 * Remove Coupon Use Case
 */

import { BasketRepository } from '../../domain/repositories/BasketRepository';

export class RemoveCouponCommand {
  constructor(public readonly basketId: string) {}
}

export class RemoveCouponUseCase {
  constructor(private readonly repository: BasketRepository) {}

  async execute(command: RemoveCouponCommand): Promise<any> {
    const basket = await this.repository.findById(command.basketId);
    if (!basket) {
      throw new Error('Basket not found');
    }

    basket.removeCoupon();
    await this.repository.save(basket);

    return basket.toJSON();
  }
}
