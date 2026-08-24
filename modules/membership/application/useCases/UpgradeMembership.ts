/**
 * UpgradeMembership Use Case
 *
 * Upgrades a customer's membership to a higher tier.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { MembershipNotFoundError, MembershipPlanNotFoundError, MembershipValidationError } from '../../domain/errors/MembershipErrors';

export interface UpgradeMembershipInput {
  membershipId: string;
  newTierId: string;
  prorateBilling?: boolean;
  effectiveDate?: Date;
}

export interface UpgradeMembershipOutput {
  membershipId: string;
  previousTierId: string;
  newTierId: string;
  newTierName: string;
  proratedAmount?: number;
  newBillingAmount: number;
  effectiveDate: string;
  nextBillingDate: string;
}

interface MembershipRecord {
  status: string;
  customerId: string;
  tierId: string;
  currentPeriodEnd?: string;
  billingPeriod?: string;
}

interface UpdatedMembership {
  currentPeriodEnd?: Date;
}

interface TierRecord {
  name: string;
  price: number;
  isActive: boolean;
}

interface UpgradeMembershipRepository {
  getMembershipById(membershipId: string): Promise<MembershipRecord | null>;
  getTierById(tierId: string): Promise<TierRecord | null>;
  updateMembership(membershipId: string, data: Record<string, unknown>): Promise<UpdatedMembership>;
  createStatusLog(data: Record<string, unknown>): Promise<void>;
}

export class UpgradeMembershipUseCase {
  constructor(private readonly membershipRepository: UpgradeMembershipRepository) {}

  async execute(input: UpgradeMembershipInput): Promise<UpgradeMembershipOutput> {
    const { membershipId, newTierId, prorateBilling = true, effectiveDate } = input;

    // Get current membership
    const membership = await this.membershipRepository.getMembershipById(membershipId);
    if (!membership) {
      throw new MembershipNotFoundError(membershipId);
    }

    if (membership.status !== 'active') {
      throw new MembershipValidationError('Can only upgrade active memberships');
    }

    // Get new tier
    const newTier = await this.membershipRepository.getTierById(newTierId);
    if (!newTier) {
      throw new MembershipPlanNotFoundError(newTierId);
    }

    if (!newTier.isActive) {
      throw new MembershipValidationError('New tier is not active');
    }

    // Get current tier for comparison
    const currentTier = await this.membershipRepository.getTierById(membership.tierId);

    // Validate upgrade (new tier should have higher price or level)
    if (!currentTier || newTier.price <= currentTier.price) {
      throw new MembershipValidationError('Cannot upgrade to a tier with equal or lower price. Use downgrade instead.');
    }

    const now = new Date();
    const effective = effectiveDate || now;

    // Calculate prorated amount if applicable
    let proratedAmount: number | undefined;
    if (prorateBilling && membership.currentPeriodEnd) {
      const periodEnd = new Date(membership.currentPeriodEnd);
      const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const daysInPeriod = membership.billingPeriod === 'monthly' ? 30 : membership.billingPeriod === 'quarterly' ? 90 : 365;
      const unusedCredit = (currentTier.price / daysInPeriod) * daysRemaining;
      const newCharge = (newTier.price / daysInPeriod) * daysRemaining;
      proratedAmount = Math.max(0, newCharge - unusedCredit);
    }

    // Update membership
    const updatedMembership = await this.membershipRepository.updateMembership(membershipId, {
      tierId: newTierId,
      upgradedAt: now,
      previousTierId: membership.tierId,
      updatedAt: now,
    });

    // Log status change
    await this.membershipRepository.createStatusLog({
      membershipId,
      previousStatus: 'active',
      newStatus: 'active',
      reason: 'upgrade',
      previousTierId: membership.tierId,
      newTierId,
      changedAt: now,
    });

    // Emit event
    await eventBus.emit('membership.upgraded', {
      membershipId,
      customerId: membership.customerId,
      previousTierId: membership.tierId,
      newTierId,
      proratedAmount,
    });

    return {
      membershipId,
      previousTierId: membership.tierId,
      newTierId,
      newTierName: newTier.name,
      proratedAmount,
      newBillingAmount: newTier.price,
      effectiveDate: effective.toISOString(),
      nextBillingDate: updatedMembership.currentPeriodEnd?.toISOString() || '',
    };
  }
}
