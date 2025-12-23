/**
 * CheckPointsBalance Use Case
 */

export interface CheckPointsBalanceInput {
  customerId: string;
}

export interface CheckPointsBalanceOutput {
  customerId: string;
  availablePoints: number;
  pendingPoints: number;
  lifetimePoints: number;
  tierName: string;
  tierMultiplier: number;
  nextTierName?: string;
  pointsToNextTier?: number;
}

export class CheckPointsBalanceUseCase {
  constructor(private readonly loyaltyRepository: any) {}

  async execute(input: CheckPointsBalanceInput): Promise<CheckPointsBalanceOutput> {
    const member = await this.loyaltyRepository.findMemberByCustomerId(input.customerId);
    if (!member) {
      // Return zero balance for non-members
      return {
        customerId: input.customerId,
        availablePoints: 0,
        pendingPoints: 0,
        lifetimePoints: 0,
        tierName: 'Non-member',
        tierMultiplier: 1,
      };
    }

    const tier = member.tier || { name: 'Standard', multiplier: 1 };
    const nextTier = await this.loyaltyRepository.findNextTier(tier.tierId);

    return {
      customerId: input.customerId,
      availablePoints: member.availablePoints,
      pendingPoints: member.pendingPoints || 0,
      lifetimePoints: member.lifetimePoints,
      tierName: tier.name,
      tierMultiplier: tier.multiplier,
      nextTierName: nextTier?.name,
      pointsToNextTier: nextTier ? nextTier.requiredPoints - member.lifetimePoints : undefined,
    };
  }
}
