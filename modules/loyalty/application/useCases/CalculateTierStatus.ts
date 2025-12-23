/**
 * CalculateTierStatus Use Case
 * 
 * Calculates and updates a customer's loyalty tier based on their activity.
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface CalculateTierStatusInput {
  customerId: string;
  programId?: string;
}

export interface TierInfo {
  tierId: string;
  tierName: string;
  tierLevel: number;
  benefits: string[];
  pointsMultiplier: number;
}

export interface CalculateTierStatusOutput {
  currentTier: TierInfo;
  previousTier?: TierInfo;
  tierChanged: boolean;
  changeType?: 'upgraded' | 'downgraded';
  pointsToNextTier?: number;
  nextTier?: TierInfo;
  qualifyingPoints: number;
  qualifyingPurchases: number;
}

export class CalculateTierStatusUseCase {
  constructor(private readonly loyaltyRepository: any) {}

  async execute(input: CalculateTierStatusInput): Promise<CalculateTierStatusOutput> {
    const { customerId, programId } = input;

    // Get customer's current tier and qualifying metrics
    const customer = await this.loyaltyRepository.getCustomerLoyalty(customerId, programId);
    if (!customer) {
      throw new Error('Customer not found in loyalty program');
    }

    // Get all tier thresholds
    const tiers = await this.loyaltyRepository.getTiers(programId);
    const sortedTiers = tiers.sort((a: any, b: any) => a.level - b.level);

    // Calculate qualifying metrics (points earned in qualification period)
    const qualificationPeriod = await this.loyaltyRepository.getQualificationPeriod(programId);
    const qualifyingMetrics = await this.loyaltyRepository.getQualifyingMetrics(
      customerId,
      qualificationPeriod.startDate,
      qualificationPeriod.endDate
    );

    // Determine new tier based on qualifying metrics
    let newTier = sortedTiers[0]; // Default to lowest tier
    for (const tier of sortedTiers) {
      if (
        qualifyingMetrics.points >= tier.pointsThreshold &&
        qualifyingMetrics.purchases >= (tier.purchasesThreshold || 0)
      ) {
        newTier = tier;
      }
    }

    const previousTier = customer.currentTier;
    const tierChanged = previousTier?.tierId !== newTier.tierId;
    let changeType: 'upgraded' | 'downgraded' | undefined;

    if (tierChanged) {
      changeType = newTier.level > (previousTier?.level || 0) ? 'upgraded' : 'downgraded';

      // Update customer's tier
      await this.loyaltyRepository.updateCustomerTier(customerId, newTier.tierId);

      // Emit event
      await eventBus.emit(
        changeType === 'upgraded' ? 'loyalty.tier_upgraded' : 'loyalty.tier_downgraded',
        {
          customerId,
          previousTierId: previousTier?.tierId,
          newTierId: newTier.tierId,
          tierName: newTier.name,
        }
      );
    }

    // Calculate points to next tier
    const nextTierIndex = sortedTiers.findIndex((t: any) => t.tierId === newTier.tierId) + 1;
    const nextTier = nextTierIndex < sortedTiers.length ? sortedTiers[nextTierIndex] : undefined;
    const pointsToNextTier = nextTier
      ? Math.max(0, nextTier.pointsThreshold - qualifyingMetrics.points)
      : undefined;

    return {
      currentTier: {
        tierId: newTier.tierId,
        tierName: newTier.name,
        tierLevel: newTier.level,
        benefits: newTier.benefits || [],
        pointsMultiplier: newTier.pointsMultiplier || 1,
      },
      previousTier: previousTier
        ? {
            tierId: previousTier.tierId,
            tierName: previousTier.name,
            tierLevel: previousTier.level,
            benefits: previousTier.benefits || [],
            pointsMultiplier: previousTier.pointsMultiplier || 1,
          }
        : undefined,
      tierChanged,
      changeType,
      pointsToNextTier,
      nextTier: nextTier
        ? {
            tierId: nextTier.tierId,
            tierName: nextTier.name,
            tierLevel: nextTier.level,
            benefits: nextTier.benefits || [],
            pointsMultiplier: nextTier.pointsMultiplier || 1,
          }
        : undefined,
      qualifyingPoints: qualifyingMetrics.points,
      qualifyingPurchases: qualifyingMetrics.purchases,
    };
  }
}
