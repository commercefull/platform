/**
 * RedeemReward Use Case
 * 
 * Redeems a specific reward using customer's loyalty points.
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface RedeemRewardInput {
  customerId: string;
  rewardId: string;
  orderId?: string;
}

export interface RedeemRewardOutput {
  redemptionId: string;
  rewardId: string;
  rewardName: string;
  pointsSpent: number;
  remainingBalance: number;
  couponCode?: string;
  productId?: string;
  discountValue?: number;
  discountType?: string;
  redeemedAt: string;
  expiresAt?: string;
}

export class RedeemRewardUseCase {
  constructor(private readonly loyaltyRepository: any) {}

  async execute(input: RedeemRewardInput): Promise<RedeemRewardOutput> {
    const { customerId, rewardId, orderId } = input;

    // Get reward details
    const reward = await this.loyaltyRepository.getRewardById(rewardId);
    if (!reward) {
      throw new Error('Reward not found');
    }

    if (!reward.isActive) {
      throw new Error('Reward is not active');
    }

    // Check validity period
    const now = new Date();
    if (reward.validTo && new Date(reward.validTo) < now) {
      throw new Error('Reward has expired');
    }

    if (reward.validFrom && new Date(reward.validFrom) > now) {
      throw new Error('Reward is not yet available');
    }

    // Check quantity
    if (reward.totalQuantity !== null && reward.remainingQuantity <= 0) {
      throw new Error('Reward is out of stock');
    }

    // Get customer's points balance
    const customer = await this.loyaltyRepository.getCustomerLoyalty(customerId);
    if (!customer) {
      throw new Error('Customer not found in loyalty program');
    }

    if (customer.pointsBalance < reward.pointsCost) {
      throw new Error(`Insufficient points. Required: ${reward.pointsCost}, Available: ${customer.pointsBalance}`);
    }

    // Check per-customer usage limit
    if (reward.maxUsagePerCustomer) {
      const usageCount = await this.loyaltyRepository.getRewardUsageCount(customerId, rewardId);
      if (usageCount >= reward.maxUsagePerCustomer) {
        throw new Error('You have reached the maximum redemptions for this reward');
      }
    }

    // Deduct points
    const newBalance = customer.pointsBalance - reward.pointsCost;
    await this.loyaltyRepository.updatePointsBalance(customerId, newBalance);

    // Record points transaction
    await this.loyaltyRepository.createTransaction({
      customerId,
      type: 'redeemed',
      points: -reward.pointsCost,
      balance: newBalance,
      description: `Redeemed reward: ${reward.name}`,
      referenceType: 'reward',
      referenceId: rewardId,
    });

    // Decrease remaining quantity if applicable
    if (reward.totalQuantity !== null) {
      await this.loyaltyRepository.decrementRewardQuantity(rewardId);
    }

    // Create redemption record
    const redemption = await this.loyaltyRepository.createRedemption({
      customerId,
      rewardId,
      orderId,
      pointsSpent: reward.pointsCost,
      status: 'completed',
      redeemedAt: now,
      expiresAt: reward.redemptionExpiryDays
        ? new Date(now.getTime() + reward.redemptionExpiryDays * 24 * 60 * 60 * 1000)
        : undefined,
    });

    // Generate coupon code if discount type reward
    let couponCode: string | undefined;
    if (reward.type === 'discount' || reward.type === 'free_shipping') {
      couponCode = await this.loyaltyRepository.generateRedemptionCoupon(redemption.redemptionId, reward);
    }

    // Emit event
    await eventBus.emit('loyalty.reward_redeemed', {
      customerId,
      rewardId,
      redemptionId: redemption.redemptionId,
      pointsSpent: reward.pointsCost,
      rewardType: reward.type,
    });

    return {
      redemptionId: redemption.redemptionId,
      rewardId: reward.rewardId,
      rewardName: reward.name,
      pointsSpent: reward.pointsCost,
      remainingBalance: newBalance,
      couponCode,
      productId: reward.productId,
      discountValue: reward.value,
      discountType: reward.valueType,
      redeemedAt: now.toISOString(),
      expiresAt: redemption.expiresAt?.toISOString(),
    };
  }
}
