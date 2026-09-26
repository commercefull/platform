/**
 * Manage Membership Tiers Use Case
 * Tier lifecycle with invariants: required-field validation on create,
 * existence on update, and the active-members guard on delete.
 */

import { MembershipPlanNotFoundError, MembershipValidationError } from '../../domain/errors/MembershipErrors';
import type { MembershipTierRecord, UserMembershipRecord } from './ManageUserMemberships';

export interface CreateTierRecordInput {
  name?: string;
  description?: string;
  monthlyPriceCents?: number;
  annualPriceCents?: number;
  level?: number;
  isActive?: boolean;
}

export interface UpdateTierRecordInput {
  name?: string;
  description?: string;
  monthlyPriceCents?: number;
  annualPriceCents?: number;
  level?: number;
  isActive?: boolean;
}

export interface ManageMembershipTiersPort {
  findTierById(tierId: string): Promise<MembershipTierRecord | null>;
  findAllTiers(includeInactive?: boolean): Promise<MembershipTierRecord[]>;
  createTier(params: Required<Omit<CreateTierRecordInput, 'description' | 'isActive'>> & { description: string; isActive: boolean }): Promise<MembershipTierRecord>;
  updateTier(id: string, params: UpdateTierRecordInput): Promise<MembershipTierRecord>;
  findAllUserMemberships(limit?: number, offset?: number, filter?: { isActive?: boolean; tierId?: string }): Promise<UserMembershipRecord[]>;
  deleteTier(id: string): Promise<unknown>;
}

export class ManageMembershipTiersUseCase {
  constructor(private readonly memberships: ManageMembershipTiersPort) {}

  async findTierById(id: string) {
    return this.memberships.findTierById(id);
  }
  async findAllTiers(includeInactive?: boolean) {
    return this.memberships.findAllTiers(includeInactive);
  }
  async findAllUserMemberships(limit?: number, offset?: number, filter?: { isActive?: boolean; tierId?: string }) {
    return this.memberships.findAllUserMemberships(limit, offset, filter);
  }

  async create(input: CreateTierRecordInput): Promise<MembershipTierRecord> {
    const { name, description, monthlyPriceCents, annualPriceCents, level, isActive = true } = input;

    if (!name || typeof monthlyPriceCents !== 'number' || typeof annualPriceCents !== 'number' || typeof level !== 'number') {
      throw new MembershipValidationError('Name, monthlyPriceCents, annualPriceCents, and level are required');
    }

    return this.memberships.createTier({
      name,
      description: description || '',
      monthlyPriceCents,
      annualPriceCents,
      level,
      isActive,
    });
  }

  async update(id: string, input: UpdateTierRecordInput): Promise<MembershipTierRecord> {
    const existingTier = await this.memberships.findTierById(id);
    if (!existingTier) {
      throw new MembershipPlanNotFoundError(id);
    }

    return this.memberships.updateTier(id, input);
  }

  async remove(id: string): Promise<void> {
    const existingTier = await this.memberships.findTierById(id);
    if (!existingTier) {
      throw new MembershipPlanNotFoundError(id);
    }

    // Cannot delete a tier that still has active user memberships
    const activeMembers = await this.memberships.findAllUserMemberships(50, 0, { tierId: id, isActive: true });
    if (activeMembers && activeMembers.length > 0) {
      throw new MembershipValidationError(
        `Cannot delete tier: ${activeMembers.length} active user memberships are using this tier`,
      );
    }

    await this.memberships.deleteTier(id);
  }
}
