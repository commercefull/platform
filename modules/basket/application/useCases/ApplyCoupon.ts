/**
 * Apply Coupon Use Case
 */

import { BasketRepository } from '../../domain/repositories/BasketRepository';
import { DiscountQuotePort } from '../../application/ports/DiscountQuotePort';
import { BasketNotFoundError, BasketValidationError } from '../../domain/errors/BasketErrors';
import { eventBus } from '../../../../libs/events/eventBus';

export class ApplyCouponCommand {
  constructor(
    public readonly basketId: string,
    public readonly couponCode: string,
  ) {}
}

export class ApplyCouponUseCase {
  constructor(
    private readonly repository: BasketRepository,
    private readonly discountQuotePort?: DiscountQuotePort,
  ) {}

  async execute(command: ApplyCouponCommand): Promise<Record<string, unknown>> {
    const basket = await this.repository.findById(command.basketId);
    if (!basket) {
      throw new BasketNotFoundError(command.basketId);
    }

    if (!this.discountQuotePort) {
      throw new BasketValidationError('Discount quote port is required to apply coupons');
    }

    const validation = await this.discountQuotePort.validateDiscount(
      command.couponCode,
      basket.subtotal.amount,
      basket.customerId,
    );

    if (!validation.valid || !validation.discount) {
      throw new BasketValidationError(validation.error || `Invalid coupon code: ${command.couponCode}`);
    }

    const discount = validation.discount;
    const discountType = discount.type === 'fixed_amount' ? 'fixed' : 'percentage';
    const discountValue = discount.value;

    basket.applyCoupon(command.couponCode, discountType, discountValue);
    await this.repository.save(basket);

    eventBus.emit('promotion.coupon_applied', {
      basketId: basket.basketId,
      couponCode: command.couponCode,
      discountType,
      discountValue,
      discountAmount: discount.discountAmount,
    });

    return basket.toJSON();
  }
}
