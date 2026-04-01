/**
 * CreateReferral Use Case
 *
 * Creates a referral record and optionally creates a reward on conversion.
 *
 * Validates: Requirements 6.9
 */

import * as referralRepo from '../../infrastructure/repositories/referralRepo';

// ============================================================================
// Command
// ============================================================================

export class CreateReferralCommand {
  constructor(
    public readonly referrerId: string,
    public readonly referredEmail: string,
    public readonly code: string,
    public readonly reward?: {
      recipientId: string;
      recipientType: string;
      type: string;
      amount: number;
      currency: string;
    },
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface CreateReferralResponse {
  referralId: string;
  referrerId: string;
  referredEmail: string;
  code: string;
  status: string;
  reward?: {
    referralRewardId: string;
    type: string;
    amount: number;
    currency: string;
    status: string;
  };
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class CreateReferralUseCase {
  constructor(private readonly refRepo: typeof referralRepo = referralRepo) {}

  async execute(command: CreateReferralCommand): Promise<CreateReferralResponse> {
    if (!command.referrerId) throw new Error('referrerId is required');
    if (!command.referredEmail) throw new Error('referredEmail is required');
    if (!command.code) throw new Error('Referral code is required');

    // Ensure code is unique
    const existing = await this.refRepo.findByCode(command.code);
    if (existing) throw new Error(`Referral code '${command.code}' is already in use`);

    const referral = await this.refRepo.create(command.referrerId, command.referredEmail, command.code);
    if (!referral) throw new Error('Failed to create referral');

    let rewardResponse: CreateReferralResponse['reward'];

    if (command.reward) {
      const reward = await this.refRepo.createReward({
        referralId: referral.referralId,
        recipientId: command.reward.recipientId,
        recipientType: command.reward.recipientType,
        type: command.reward.type,
        amount: command.reward.amount,
        currency: command.reward.currency,
        status: 'pending',
        awardedAt: undefined,
      });

      if (reward) {
        rewardResponse = {
          referralRewardId: reward.referralRewardId,
          type: reward.type,
          amount: reward.amount,
          currency: reward.currency,
          status: reward.status,
        };
      }
    }

    return {
      referralId: referral.referralId,
      referrerId: referral.referrerId,
      referredEmail: referral.referredEmail,
      code: referral.code,
      status: referral.status,
      reward: rewardResponse,
      createdAt: referral.createdAt.toISOString(),
    };
  }
}
