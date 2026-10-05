/**
 * Apply Loyalty Reward Use Case
 * Applies a loyalty reward to a checkout session — the reward's points are
 * debited at the payment boundary once an order exists.
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { LoyaltyQuotePort } from '../../application/ports/LoyaltyPort';
import { Money } from '../../../../libs/money';
import { CheckoutResponse, mapCheckoutToResponse } from './InitiateCheckout';
import { eventBus } from '../../../../libs/events/eventBus';
import { BadRequestError, NotFoundError } from '../../../../libs/errors';

// ============================================================================
// Command
// ============================================================================

export class ApplyLoyaltyRewardCommand {
  constructor(
    public readonly checkoutId: string,
    public readonly rewardId: string,
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class ApplyLoyaltyRewardUseCase {
  constructor(
    private readonly checkoutRepository: CheckoutRepository,
    private readonly loyaltyQuotePort: LoyaltyQuotePort,
  ) {}

  async execute(command: ApplyLoyaltyRewardCommand): Promise<CheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new NotFoundError('Checkout session not found');
    }

    if (!session.customerId) {
      throw new BadRequestError('Loyalty rewards require an authenticated customer');
    }

    const reward = await this.loyaltyQuotePort.getReward(command.rewardId);
    if (!reward || !reward.isActive) {
      throw new BadRequestError(`Loyalty reward not available: ${command.rewardId}`);
    }

    const balance = await this.loyaltyQuotePort.getPointsBalance(session.customerId);
    if (balance === null) {
      throw new BadRequestError('Customer is not enrolled in the loyalty program');
    }
    if (balance < reward.pointsCost) {
      throw new BadRequestError(`Insufficient loyalty points: need ${reward.pointsCost}, have ${balance}`);
    }

    const discount = this.computeDiscount(reward.value, reward.valueType, session);

    session.applyLoyaltyReward(reward.rewardId, reward.pointsCost, discount);
    await this.checkoutRepository.save(session);

    eventBus.emit('checkout.updated', {
      checkoutId: session.id,
      field: 'loyaltyReward',
      loyaltyRewardId: reward.rewardId,
      loyaltyPointsRedeemed: reward.pointsCost,
      loyaltyDiscountCents: discount.cents,
    });

    return mapCheckoutToResponse(session);
  }

  private computeDiscount(
    value: number | null | undefined,
    valueType: string | null | undefined,
    session: { subtotal: Money; discountAmount: Money; shippingAmount: Money },
  ): Money {
    const currency = session.subtotal.currency;
    if (value == null) return Money.zero(currency);

    let discountCents: number;
    if (valueType === 'percentage' || valueType === 'percent') {
      const base = Math.max(0, session.subtotal.cents - session.discountAmount.cents);
      discountCents = Math.round((base * value) / 100);
    } else {
      // 'fixed' / 'amountCents' — value is already in cents
      discountCents = Math.round(value);
    }

    const remaining = Math.max(0, session.subtotal.cents + session.shippingAmount.cents - session.discountAmount.cents);
    return Money.fromCents(Math.min(discountCents, remaining), currency);
  }
}
