/**
 * CreateMembershipTier Use Case
 */

export interface TierBenefit {
  type: 'discount' | 'free_shipping' | 'early_access' | 'points_multiplier' | 'exclusive_products' | 'custom';
  value: number | string;
  description?: string;
}

export interface CreateMembershipTierInput {
  name: string;
  description?: string;
  level: number;
  price?: number;
  billingPeriod?: 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
  benefits: TierBenefit[];
  requiredPoints?: number;
  maxMembers?: number;
  isActive?: boolean;
}

export interface CreateMembershipTierOutput {
  tierId: string;
  name: string;
  level: number;
  price?: number;
  benefitCount: number;
  createdAt: string;
}

export class CreateMembershipTierUseCase {
  constructor(private readonly membershipRepository: any) {}

  async execute(input: CreateMembershipTierInput): Promise<CreateMembershipTierOutput> {
    if (!input.name || input.level === undefined) {
      throw new Error('Name and level are required');
    }

    // Check for duplicate level
    const existingTier = await this.membershipRepository.findTierByLevel(input.level);
    if (existingTier) {
      throw new Error(`A tier with level ${input.level} already exists`);
    }

    const tierId = `mbt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    const tier = await this.membershipRepository.createTier({
      tierId,
      name: input.name,
      description: input.description,
      level: input.level,
      price: input.price,
      billingPeriod: input.billingPeriod,
      benefits: input.benefits,
      requiredPoints: input.requiredPoints,
      maxMembers: input.maxMembers,
      currentMembers: 0,
      isActive: input.isActive ?? true,
    });

    return {
      tierId: tier.tierId,
      name: tier.name,
      level: tier.level,
      price: tier.price,
      benefitCount: tier.benefits.length,
      createdAt: tier.createdAt.toISOString(),
    };
  }
}
