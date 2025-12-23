/**
 * UpdateMembershipTier Use Case
 *
 * Updates an existing membership tier's configuration.
 */

export interface UpdateMembershipTierInput {
  tierId: string;
  name?: string;
  description?: string;
  price?: number;
  billingPeriod?: 'monthly' | 'quarterly' | 'annual';
  benefits?: string[];
  discountPercentage?: number;
  freeShipping?: boolean;
  prioritySupport?: boolean;
  exclusiveAccess?: boolean;
  pointsMultiplier?: number;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateMembershipTierOutput {
  tierId: string;
  name: string;
  price: number;
  billingPeriod: string;
  isActive: boolean;
  updatedAt: string;
}

export class UpdateMembershipTierUseCase {
  constructor(private readonly membershipRepository: any) {}

  async execute(input: UpdateMembershipTierInput): Promise<UpdateMembershipTierOutput> {
    const { tierId, ...updates } = input;

    // Get existing tier
    const tier = await this.membershipRepository.getTierById(tierId);
    if (!tier) {
      throw new Error('Membership tier not found');
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.billingPeriod !== undefined) updateData.billingPeriod = updates.billingPeriod;
    if (updates.benefits !== undefined) updateData.benefits = updates.benefits;
    if (updates.discountPercentage !== undefined) updateData.discountPercentage = updates.discountPercentage;
    if (updates.freeShipping !== undefined) updateData.freeShipping = updates.freeShipping;
    if (updates.prioritySupport !== undefined) updateData.prioritySupport = updates.prioritySupport;
    if (updates.exclusiveAccess !== undefined) updateData.exclusiveAccess = updates.exclusiveAccess;
    if (updates.pointsMultiplier !== undefined) updateData.pointsMultiplier = updates.pointsMultiplier;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

    updateData.updatedAt = new Date();

    const updatedTier = await this.membershipRepository.updateTier(tierId, updateData);

    return {
      tierId: updatedTier.tierId,
      name: updatedTier.name,
      price: updatedTier.price,
      billingPeriod: updatedTier.billingPeriod,
      isActive: updatedTier.isActive,
      updatedAt: updatedTier.updatedAt.toISOString(),
    };
  }
}
