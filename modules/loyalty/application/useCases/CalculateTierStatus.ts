/**
 * CalculateTierStatus Use Case
 *
 * Calculates and updates a customer's loyalty tier based on their activity.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { LoyaltyMemberNotFoundError } from '../../domain/errors/LoyaltyErrors';

export interface CalculateTierStatusInput {
  customerId: string;
  programId?: string;
}

interface TierInfo {
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

interface LoyaltyTierData {
  tierId: string;
  name: string;
  level: number;
  pointsThreshold: number;
  purchasesThreshold?: number;
  benefits?: string[];
  pointsMultiplier?: number;
}

interface CustomerLoyaltyData {
  currentTier?: LoyaltyTierData;
}

interface QualificationPeriod {
  startDate: Date;
  endDate: Date;
}

interface QualifyingMetrics {
  points: number;
  purchases: number;
}

export interface CalculateTierRepository {
  getCustomerLoyalty(customerId: string, programId?: string): Promise<CustomerLoyaltyData | null>;
  getTiers(programId?: string): Promise<LoyaltyTierData[]>;
  getQualificationPeriod(programId?: string): Promise<QualificationPeriod>;
  getQualifyingMetrics(customerId: string, startDate: Date, endDate: Date): Promise<QualifyingMetrics>;
  updateCustomerTier(customerId: string, tierId: string): Promise<void>;
}

export class CalculateTierStatusUseCase {
  constructor(private readonly loyaltyRepository: CalculateTierRepository) {}

  async execute(input: CalculateTierStatusInput): Promise<CalculateTierStatusOutput> {
    const { customerId, programId } = input;

    // Get customer's current tier and qualifying metrics
    const customer = await this.loyaltyRepository.getCustomerLoyalty(customerId, programId);
    if (!customer) {
      throw new LoyaltyMemberNotFoundError(customerId);
    }

    // Get all tier thresholds
    const tiers = await this.loyaltyRepository.getTiers(programId);
    const sortedTiers = tiers.sort((a: LoyaltyTierData, b: LoyaltyTierData) => a.level - b.level);

    // Calculate qualifying metrics (points earned in qualification period)
    const qualificationPeriod = await this.loyaltyRepository.getQualificationPeriod(programId);
    const qualifyingMetrics = await this.loyaltyRepository.getQualifyingMetrics(
      customerId,
      qualificationPeriod.startDate,
      qualificationPeriod.endDate,
    );

    // Determine new tier based on qualifying metrics
    const newTier = determineTier(sortedTiers, qualifyingMetrics);

    const previousTier = customer.currentTier;
    const tierChanged = previousTier?.tierId !== newTier.tierId;
    const changeType = tierChanged ? (newTier.level > (previousTier?.level || 0) ? 'upgraded' : 'downgraded') : undefined;

    if (changeType) {
      // Update customer's tier
      await this.loyaltyRepository.updateCustomerTier(customerId, newTier.tierId);

      // Emit event
      await eventBus.emit(changeType === 'upgraded' ? 'loyalty.tier_upgraded' : 'loyalty.tier_downgraded', {
        customerId,
        previousTierId: previousTier?.tierId,
        newTierId: newTier.tierId,
        tierName: newTier.name,
      });
    }

    // Calculate points to next tier
    const nextTierIndex = sortedTiers.findIndex((t: LoyaltyTierData) => t.tierId === newTier.tierId) + 1;
    const nextTier = nextTierIndex < sortedTiers.length ? sortedTiers[nextTierIndex] : undefined;
    const pointsToNextTier = nextTier ? Math.max(0, nextTier.pointsThreshold - qualifyingMetrics.points) : undefined;

    return {
      currentTier: toTierInfo(newTier),
      previousTier: previousTier ? toTierInfo(previousTier) : undefined,
      tierChanged,
      changeType,
      pointsToNextTier,
      nextTier: nextTier ? toTierInfo(nextTier) : undefined,
      qualifyingPoints: qualifyingMetrics.points,
      qualifyingPurchases: qualifyingMetrics.purchases,
    };
  }
}

/** Highest tier whose thresholds the metrics satisfy. */
function determineTier(sortedTiers: LoyaltyTierData[], metrics: QualifyingMetrics): LoyaltyTierData {
  let newTier = sortedTiers[0]; // Default to lowest tier
  for (const tier of sortedTiers) {
    if (metrics.points >= tier.pointsThreshold && metrics.purchases >= (tier.purchasesThreshold || 0)) {
      newTier = tier;
    }
  }
  return newTier;
}

function toTierInfo(tier: LoyaltyTierData): TierInfo {
  return {
    tierId: tier.tierId,
    tierName: tier.name,
    tierLevel: tier.level,
    benefits: tier.benefits || [],
    pointsMultiplier: tier.pointsMultiplier || 1,
  };
}
