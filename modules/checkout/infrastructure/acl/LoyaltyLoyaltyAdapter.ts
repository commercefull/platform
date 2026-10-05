/**
 * LoyaltyLoyaltyAdapter
 *
 * Maps checkout's loyalty ports onto the loyalty module: reward/balance
 * lookups go to the loyalty repository, point redemption goes through
 * RedeemPointsUseCase (idempotent per orderId).
 */

import type { LoyaltyQuotePort, LoyaltyRedemptionPort, LoyaltyRewardQuote } from '../../application/ports/LoyaltyPort';
import type { LoyaltyRepository } from '../../../loyalty/domain/repositories/LoyaltyRepository';
import type { RedeemPointsUseCase } from '../../../loyalty/application/useCases/RedeemPoints';

export class LoyaltyLoyaltyAdapter implements LoyaltyQuotePort, LoyaltyRedemptionPort {
  constructor(
    private readonly loyaltyRepository: Pick<LoyaltyRepository, 'findCustomerPoints' | 'findRewardById'>,
    private readonly redeemPointsUseCase: RedeemPointsUseCase,
  ) {}

  async getPointsBalance(customerId: string): Promise<number | null> {
    const points = await this.loyaltyRepository.findCustomerPoints(customerId);
    return points ? points.currentPoints : null;
  }

  async getReward(rewardId: string): Promise<LoyaltyRewardQuote | null> {
    const reward = await this.loyaltyRepository.findRewardById(rewardId);
    if (!reward) return null;
    return {
      rewardId: reward.rewardId,
      name: reward.name,
      pointsCost: reward.pointsCost,
      value: reward.value !== null ? Number(reward.value) : null,
      valueType: reward.valueType,
      isActive: reward.isActive === true,
    };
  }

  async redeemPoints(input: {
    customerId: string;
    points: number;
    orderId: string;
    rewardId?: string;
  }): Promise<{ transactionId: string }> {
    const result = await this.redeemPointsUseCase.execute({
      customerId: input.customerId,
      points: input.points,
      orderId: input.orderId,
      rewardId: input.rewardId,
      description: `Points redeemed at checkout for order ${input.orderId}`,
    });
    return { transactionId: result.transactionId };
  }
}
