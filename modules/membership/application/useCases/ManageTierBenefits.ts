/**
 * Manage Tier Benefits Use Case
 * Benefit create/update/delete with existence and tier-association checks.
 */

import { MembershipBenefitNotFoundError, MembershipPlanNotFoundError, MembershipValidationError } from '../../domain/errors/MembershipErrors';
import type { MembershipTierRecord } from './ManageUserMemberships';

export interface MembershipBenefitRecord {
  id: string;
  tierIds: string[];
}

export interface CreateTierBenefitInput {
  name?: string;
  description?: string;
  tierIds?: string[];
  benefitType?: string;
  discountPercentage?: number;
  discountAmountCents?: number;
  isActive?: boolean;
}

export interface UpdateTierBenefitInput {
  name?: string;
  description?: string;
  tierIds?: string[];
  benefitType?: string;
  discountPercentage?: number;
  discountAmountCents?: number;
  isActive?: boolean;
}

export interface ManageTierBenefitsPort {
  findBenefitById(id: string): Promise<MembershipBenefitRecord | null>;
  findBenefitsByTierId(tierId: string): Promise<MembershipBenefitRecord[]>;
  findAllBenefits(includeInactive?: boolean): Promise<MembershipBenefitRecord[]>;
  findTierById(tierId: string): Promise<MembershipTierRecord | null>;
  createBenefit(params: {
    name: string;
    description?: string;
    tierIds: string[];
    benefitType: string;
    discountPercentage?: number;
    discountAmountCents?: number;
    isActive?: boolean;
  }): Promise<MembershipBenefitRecord>;
  updateBenefit(id: string, params: Omit<UpdateTierBenefitInput, 'tierIds'> & { tierIds?: string[] }): Promise<MembershipBenefitRecord>;
  deleteBenefit(id: string): Promise<unknown>;
}

export class ManageTierBenefitsUseCase {
  constructor(private readonly memberships: ManageTierBenefitsPort) {}

  async findBenefitById(id: string) {
    return this.memberships.findBenefitById(id);
  }
  async findBenefitsByTierId(tierId: string) {
    return this.memberships.findBenefitsByTierId(tierId);
  }
  async findAllBenefits(includeInactive?: boolean) {
    return this.memberships.findAllBenefits(includeInactive);
  }

  async create(input: CreateTierBenefitInput): Promise<MembershipBenefitRecord> {
    const { name, description, tierIds, benefitType, discountPercentage, discountAmountCents, isActive = true } = input;

    const tierId = tierIds?.[0];

    if (!name || !tierId || !benefitType) {
      throw new MembershipValidationError('Name, tierId, and benefitType are required');
    }

    const tier = await this.memberships.findTierById(tierId);
    if (!tier) {
      throw new MembershipPlanNotFoundError(tierId);
    }

    return this.memberships.createBenefit({
      name,
      description,
      tierIds: [tierId],
      benefitType,
      discountPercentage,
      discountAmountCents,
      isActive,
    });
  }

  async update(id: string, input: UpdateTierBenefitInput): Promise<MembershipBenefitRecord> {
    const tierId = input.tierIds ? input.tierIds[0] : undefined;

    const existingBenefit = await this.memberships.findBenefitById(id);
    if (!existingBenefit) {
      throw new MembershipBenefitNotFoundError(id);
    }

    // If tier ID is changing, verify that the new tier exists
    if (tierId && !existingBenefit.tierIds.includes(tierId)) {
      const tier = await this.memberships.findTierById(tierId);
      if (!tier) {
        throw new MembershipPlanNotFoundError(tierId);
      }
    }

    return this.memberships.updateBenefit(id, {
      name: input.name,
      description: input.description,
      tierIds: tierId ? [tierId] : undefined,
      benefitType: input.benefitType,
      discountPercentage: input.discountPercentage,
      discountAmountCents: input.discountAmountCents,
      isActive: input.isActive,
    });
  }

  async remove(id: string): Promise<void> {
    const existingBenefit = await this.memberships.findBenefitById(id);
    if (!existingBenefit) {
      throw new MembershipBenefitNotFoundError(id);
    }

    await this.memberships.deleteBenefit(id);
  }
}
