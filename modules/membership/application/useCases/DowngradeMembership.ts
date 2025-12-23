/**
 * DowngradeMembership Use Case
 *
 * Downgrades a customer's membership to a lower tier.
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface DowngradeMembershipInput {
  membershipId: string;
  newTierId: string;
  effectiveAtPeriodEnd?: boolean;
  reason?: string;
}

export interface DowngradeMembershipOutput {
  membershipId: string;
  previousTierId: string;
  newTierId: string;
  newTierName: string;
  effectiveDate: string;
  immediateDowngrade: boolean;
  newBillingAmount: number;
}

export class DowngradeMembershipUseCase {
  constructor(private readonly membershipRepository: any) {}

  async execute(input: DowngradeMembershipInput): Promise<DowngradeMembershipOutput> {
    const { membershipId, newTierId, effectiveAtPeriodEnd = true, reason } = input;

    // Get current membership
    const membership = await this.membershipRepository.getMembershipById(membershipId);
    if (!membership) {
      throw new Error('Membership not found');
    }

    if (membership.status !== 'active') {
      throw new Error('Can only downgrade active memberships');
    }

    // Get new tier
    const newTier = await this.membershipRepository.getTierById(newTierId);
    if (!newTier) {
      throw new Error('New tier not found');
    }

    if (!newTier.isActive) {
      throw new Error('New tier is not active');
    }

    // Get current tier for comparison
    const currentTier = await this.membershipRepository.getTierById(membership.tierId);

    // Validate downgrade (new tier should have lower price or level)
    if (newTier.price >= currentTier.price) {
      throw new Error('Cannot downgrade to a tier with equal or higher price. Use upgrade instead.');
    }

    const now = new Date();
    let effectiveDate: Date;

    if (effectiveAtPeriodEnd && membership.currentPeriodEnd) {
      // Schedule downgrade for end of current period
      effectiveDate = new Date(membership.currentPeriodEnd);

      await this.membershipRepository.updateMembership(membershipId, {
        scheduledDowngradeTierId: newTierId,
        scheduledDowngradeDate: effectiveDate,
        updatedAt: now,
      });
    } else {
      // Immediate downgrade
      effectiveDate = now;

      await this.membershipRepository.updateMembership(membershipId, {
        tierId: newTierId,
        downgradedAt: now,
        previousTierId: membership.tierId,
        updatedAt: now,
      });
    }

    // Log status change
    await this.membershipRepository.createStatusLog({
      membershipId,
      previousStatus: 'active',
      newStatus: 'active',
      reason: reason || 'downgrade',
      previousTierId: membership.tierId,
      newTierId,
      changedAt: now,
      effectiveAt: effectiveDate,
    });

    // Emit event
    await eventBus.emit('membership.downgraded', {
      membershipId,
      customerId: membership.customerId,
      previousTierId: membership.tierId,
      newTierId,
      effectiveAtPeriodEnd,
      effectiveDate: effectiveDate.toISOString(),
    });

    return {
      membershipId,
      previousTierId: membership.tierId,
      newTierId,
      newTierName: newTier.name,
      effectiveDate: effectiveDate.toISOString(),
      immediateDowngrade: !effectiveAtPeriodEnd,
      newBillingAmount: newTier.price,
    };
  }
}
