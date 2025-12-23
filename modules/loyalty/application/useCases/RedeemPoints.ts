/**
 * RedeemPoints Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface RedeemPointsInput {
  customerId: string;
  points: number;
  rewardId?: string;
  orderId?: string;
  description?: string;
}

export interface RedeemPointsOutput {
  transactionId: string;
  customerId: string;
  pointsRedeemed: number;
  newBalance: number;
  discountValue?: number;
}

export class RedeemPointsUseCase {
  constructor(
    private readonly loyaltyRepository: any,
    private readonly rewardRepository: any,
  ) {}

  async execute(input: RedeemPointsInput): Promise<RedeemPointsOutput> {
    const member = await this.loyaltyRepository.findMemberByCustomerId(input.customerId);
    if (!member) {
      throw new Error('Customer is not a loyalty member');
    }

    if (member.availablePoints < input.points) {
      throw new Error(`Insufficient points. Available: ${member.availablePoints}, Requested: ${input.points}`);
    }

    let discountValue: number | undefined;
    let description = input.description;

    // If redeeming for a reward
    if (input.rewardId) {
      const reward = await this.rewardRepository.findById(input.rewardId);
      if (!reward) {
        throw new Error(`Reward not found: ${input.rewardId}`);
      }
      if (!reward.isActive) {
        throw new Error('Reward is not active');
      }
      if (reward.pointsCost > input.points) {
        throw new Error(`Reward requires ${reward.pointsCost} points`);
      }

      discountValue = reward.discountValue;
      description = description || `Redeemed for ${reward.name}`;
    }

    // Create redemption transaction
    const transactionId = `lpt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    await this.loyaltyRepository.createTransaction({
      transactionId,
      memberId: member.memberId,
      customerId: input.customerId,
      type: 'redeem',
      points: -input.points,
      orderId: input.orderId,
      rewardId: input.rewardId,
      description: description || 'Points redemption',
    });

    // Update member balance
    const newBalance = member.availablePoints - input.points;
    await this.loyaltyRepository.updateMemberPoints(member.memberId, {
      availablePoints: newBalance,
    });

    eventBus.emit('loyalty.points_redeemed', {
      customerId: input.customerId,
      points: input.points,
      rewardId: input.rewardId,
      orderId: input.orderId,
    });

    return {
      transactionId,
      customerId: input.customerId,
      pointsRedeemed: input.points,
      newBalance,
      discountValue,
    };
  }
}
