/**
 * EarnPoints Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { LoyaltyProgramNotFoundError } from '../../domain/errors/LoyaltyErrors';

export interface EarnPointsInput {
  customerId: string;
  orderId?: string;
  actionType: 'purchase' | 'referral' | 'review' | 'signup' | 'bonus';
  amount?: number; // Order amount for purchase
  points?: number; // Fixed points for non-purchase actions
  description?: string;
}

export interface EarnPointsOutput {
  transactionId: string;
  customerId: string;
  pointsEarned: number;
  newBalance: number;
}

export interface EarnPointsMember {
  memberId: string;
  tierId: string;
  availablePoints: number;
  lifetimePoints: number;
  tier?: {
    multiplier: number;
  };
}

export interface EarnPointsProgram {
  programId: string;
  defaultTierId: string;
  baseEarnRate?: number;
  earnRates?: Record<string, number>;
}

export interface EarnPointsRepository {
  findMemberByCustomerId(customerId: string): Promise<EarnPointsMember | null>;
  createMember(data: {
    customerId: string;
    programId: string;
    tierId: string;
    availablePoints: number;
    lifetimePoints: number;
  }): Promise<EarnPointsMember>;
  createTransaction(data: Record<string, unknown>): Promise<void>;
  updateMemberPoints(memberId: string, data: { availablePoints: number; lifetimePoints?: number }): Promise<void>;
}

export interface EarnPointsProgramRepository {
  findActive(): Promise<EarnPointsProgram | null>;
}

export class EarnPointsUseCase {
  constructor(
    private readonly loyaltyRepository: EarnPointsRepository,
    private readonly loyaltyProgramRepository: EarnPointsProgramRepository,
  ) {}

  async execute(input: EarnPointsInput): Promise<EarnPointsOutput> {
    // Get active loyalty program
    const program = await this.loyaltyProgramRepository.findActive();
    if (!program) {
      throw new LoyaltyProgramNotFoundError();
    }

    // Get or create member
    let member = await this.loyaltyRepository.findMemberByCustomerId(input.customerId);
    if (!member) {
      member = await this.loyaltyRepository.createMember({
        customerId: input.customerId,
        programId: program.programId,
        tierId: program.defaultTierId,
        availablePoints: 0,
        lifetimePoints: 0,
      });
    }

    // Calculate points
    let pointsToEarn = input.points || 0;

    if (input.actionType === 'purchase' && input.amount) {
      // Points per dollar/currency unit
      const earnRate = program.earnRates?.[member.tierId] || program.baseEarnRate || 1;
      pointsToEarn = Math.floor(input.amount * earnRate);
    }

    // Apply tier multiplier
    const tierMultiplier = member.tier?.multiplier || 1;
    pointsToEarn = Math.floor(pointsToEarn * tierMultiplier);

    // Create transaction
    const transactionId = `lpt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    await this.loyaltyRepository.createTransaction({
      transactionId,
      memberId: member.memberId,
      customerId: input.customerId,
      type: 'earn',
      points: pointsToEarn,
      orderId: input.orderId,
      actionType: input.actionType,
      description: input.description || `Points earned from ${input.actionType}`,
    });

    // Update member balance
    const newBalance = member.availablePoints + pointsToEarn;
    await this.loyaltyRepository.updateMemberPoints(member.memberId, {
      availablePoints: newBalance,
      lifetimePoints: member.lifetimePoints + pointsToEarn,
    });

    eventBus.emit('loyalty.points_earned', {
      customerId: input.customerId,
      points: pointsToEarn,
      actionType: input.actionType,
      orderId: input.orderId,
    });

    return {
      transactionId,
      customerId: input.customerId,
      pointsEarned: pointsToEarn,
      newBalance,
    };
  }
}
