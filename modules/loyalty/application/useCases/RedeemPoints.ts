/**
 * RedeemPoints Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { LoyaltyMemberNotFoundError, LoyaltyRewardNotFoundError, RewardNotAvailableError, InsufficientPointsError, LoyaltyValidationError } from '../../domain/errors/LoyaltyErrors';

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

export interface RedeemPointsMember {
  memberId: string;
  availablePoints: number;
}

export interface RedeemPointsReward {
  isActive: boolean;
  pointsCost: number;
  discountValue?: number;
  name: string;
}

export interface RedeemPointsRepository {
  findMemberByCustomerId(customerId: string): Promise<RedeemPointsMember | null>;
  createTransaction(data: Record<string, unknown>): Promise<void>;
  updateMemberPoints(memberId: string, data: { availablePoints: number }): Promise<void>;
}

export interface RedeemPointsRewardRepository {
  findById(rewardId: string): Promise<RedeemPointsReward | null>;
}

export class RedeemPointsUseCase {
  constructor(
    private readonly loyaltyRepository: RedeemPointsRepository,
    private readonly rewardRepository: RedeemPointsRewardRepository,
  ) {}

  async execute(input: RedeemPointsInput): Promise<RedeemPointsOutput> {
    const member = await this.loyaltyRepository.findMemberByCustomerId(input.customerId);
    if (!member) {
      throw new LoyaltyMemberNotFoundError(input.customerId);
    }

    if (member.availablePoints < input.points) {
      throw new InsufficientPointsError(input.points, member.availablePoints);
    }

    let discountValue: number | undefined;
    let description = input.description;

    // If redeeming for a reward
    if (input.rewardId) {
      const reward = await this.rewardRepository.findById(input.rewardId);
      if (!reward) {
        throw new LoyaltyRewardNotFoundError(input.rewardId);
      }
      if (!reward.isActive) {
        throw new RewardNotAvailableError(input.rewardId);
      }
      if (reward.pointsCost > input.points) {
        throw new LoyaltyValidationError(`Reward requires ${reward.pointsCost} points`);
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
