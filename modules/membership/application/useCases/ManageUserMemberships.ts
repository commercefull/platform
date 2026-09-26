/**
 * Manage User Memberships Use Case
 * Business-API user membership lifecycle: create (uniqueness + tier
 * checks), update (existence + tier re-validation), cancel.
 */

import { MembershipPlanNotFoundError, MembershipValidationError, UserMembershipNotFoundError } from '../../domain/errors/MembershipErrors';

export interface MembershipTierRecord {
  id: string;
  name?: string;
  isActive?: boolean;
}

export interface UserMembershipRecord {
  id: string;
  userId: string;
  tierId: string;
  isActive: boolean;
}

export interface CreateUserMembershipInput {
  userId?: string;
  tierId?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  autoRenew?: boolean;
  membershipType?: 'monthly' | 'annual' | 'lifetime';
  lastRenewalDate?: string;
  nextRenewalDate?: string;
  paymentMethod?: string;
}

export interface UpdateUserMembershipInput {
  tierId?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  autoRenew?: boolean;
  membershipType?: 'monthly' | 'annual' | 'lifetime';
  lastRenewalDate?: string;
  nextRenewalDate?: string;
  paymentMethod?: string;
}

export type CreateUserMembershipParams = Omit<CreateUserMembershipInput, 'userId' | 'tierId'> & {
  userId: string;
  tierId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  autoRenew: boolean;
  membershipType: 'monthly' | 'annual' | 'lifetime';
};

export interface ManageUserMembershipsPort {
  findMembershipByUserId(userId: string): Promise<UserMembershipRecord | null>;
  findUserMembershipById(id: string): Promise<UserMembershipRecord | null>;
  findAllUserMemberships(limit?: number, offset?: number, filter?: { isActive?: boolean; tierId?: string }): Promise<UserMembershipRecord[]>;
  getUserMembershipBenefits(userId: string): Promise<unknown[]>;
  findTierById(tierId: string): Promise<MembershipTierRecord | null>;
  createUserMembership(params: CreateUserMembershipParams): Promise<UserMembershipRecord>;
  updateUserMembership(id: string, params: UpdateUserMembershipInput): Promise<UserMembershipRecord>;
  cancelUserMembership(id: string): Promise<UserMembershipRecord>;
}

export class ManageUserMembershipsUseCase {
  constructor(private readonly memberships: ManageUserMembershipsPort) {}

  async findMembershipByUserId(userId: string) {
    return this.memberships.findMembershipByUserId(userId);
  }
  async findUserMembershipById(id: string) {
    return this.memberships.findUserMembershipById(id);
  }
  async findAllUserMemberships(limit?: number, offset?: number, filter?: { isActive?: boolean; tierId?: string }) {
    return this.memberships.findAllUserMemberships(limit, offset, filter);
  }
  async getUserMembershipBenefits(userId: string) {
    return this.memberships.getUserMembershipBenefits(userId);
  }

  async create(input: CreateUserMembershipInput): Promise<UserMembershipRecord> {
    const {
      userId,
      tierId,
      startDate = new Date().toISOString(),
      endDate,
      isActive = true,
      autoRenew = false,
      membershipType = 'monthly',
      lastRenewalDate,
      nextRenewalDate,
      paymentMethod,
    } = input;

    if (!userId || !tierId) {
      throw new MembershipValidationError('User ID and Tier ID are required');
    }

    // Check if user already has an active membership
    const existingMembership = await this.memberships.findMembershipByUserId(userId);
    if (existingMembership && existingMembership.isActive) {
      throw new MembershipValidationError(`User with ID ${userId} already has an active membership`);
    }

    const tier = await this.memberships.findTierById(tierId);
    if (!tier) {
      throw new MembershipPlanNotFoundError(tierId);
    }

    return this.memberships.createUserMembership({
      userId,
      tierId,
      startDate,
      endDate: endDate || '',
      isActive,
      autoRenew,
      membershipType,
      lastRenewalDate,
      nextRenewalDate,
      paymentMethod,
    });
  }

  async update(id: string, input: UpdateUserMembershipInput): Promise<UserMembershipRecord> {
    const existingMembership = await this.memberships.findUserMembershipById(id);
    if (!existingMembership) {
      throw new UserMembershipNotFoundError(id);
    }

    // If tier is being updated, verify that the new tier exists
    if (input.tierId && input.tierId !== existingMembership.tierId) {
      const tier = await this.memberships.findTierById(input.tierId);
      if (!tier) {
        throw new MembershipPlanNotFoundError(input.tierId);
      }
    }

    return this.memberships.updateUserMembership(id, { ...input });
  }

  async cancel(id: string): Promise<UserMembershipRecord> {
    const existingMembership = await this.memberships.findUserMembershipById(id);
    if (!existingMembership) {
      throw new UserMembershipNotFoundError(id);
    }

    return this.memberships.cancelUserMembership(id);
  }
}
