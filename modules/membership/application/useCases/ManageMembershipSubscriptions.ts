import type { MembershipSubscription } from '../../../../libs/db/types';
import { logger } from '../../../../libs/logger';

export interface MembershipSubscriptionsPort {
  findById(id: string): Promise<MembershipSubscription | null>;
  changePlan(membershipId: string, newPlanId: string, notes?: string): Promise<unknown>;
  pause(membershipId: string): Promise<unknown>;
  resume(membershipId: string): Promise<unknown>;
  cancel(membershipId: string): Promise<unknown>;
}

export interface MembershipPlanLookupPort {
  findById(id: string): Promise<{ name: string; level: number } | null>;
}

export interface TierChangeResult {
  isUpgrade: boolean;
  from?: string;
  to: string;
  effective: Date;
  prorated: boolean;
  scheduled: boolean;
}

export type BulkMembershipOperation = 'activate' | 'deactivate' | 'upgrade' | 'cancel';

export interface BulkOperationResult {
  successCount: number;
  failureCount: number;
  results: Array<{ id: string; status: 'success' | 'error'; operation?: string; error?: string }>;
}

export class ManageMembershipSubscriptionsUseCase {
  constructor(
    private readonly membershipSubscriptionRepo: MembershipSubscriptionsPort,
    private readonly planLookup?: MembershipPlanLookupPort,
  ) {}

  async findById(id: string): Promise<MembershipSubscription | null> {
    return this.membershipSubscriptionRepo.findById(id);
  }
  async changePlan(membershipId: string, newPlanId: string, notes?: string) {
    return this.membershipSubscriptionRepo.changePlan(membershipId, newPlanId, notes);
  }
  async pause(membershipId: string) {
    return this.membershipSubscriptionRepo.pause(membershipId);
  }
  async resume(membershipId: string) {
    return this.membershipSubscriptionRepo.resume(membershipId);
  }
  async cancel(membershipId: string) {
    return this.membershipSubscriptionRepo.cancel(membershipId);
  }

  /**
   * Apply a bulk operation to a set of memberships. Per-item failures are
   * captured in the result instead of aborting the batch.
   */
  async bulkOperate(operation: BulkMembershipOperation, membershipIds: string[], newTierId?: string): Promise<BulkOperationResult> {
    let successCount = 0;
    let failureCount = 0;
    const results: BulkOperationResult['results'] = [];

    for (const membershipId of membershipIds) {
      try {
        switch (operation) {
          case 'activate':
            await this.membershipSubscriptionRepo.resume(membershipId);
            break;
          case 'deactivate':
            await this.membershipSubscriptionRepo.pause(membershipId);
            break;
          case 'upgrade':
            if (!newTierId) throw new Error('New tier ID required for upgrade');
            await this.membershipSubscriptionRepo.changePlan(membershipId, newTierId);
            break;
          case 'cancel':
            await this.membershipSubscriptionRepo.cancel(membershipId);
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
        results.push({ id: membershipId, status: 'success', operation });
        successCount++;
      } catch (error: unknown) {
        logger.warn('Bulk membership operation failed:', error);
        results.push({ id: membershipId, status: 'error', error: (error as Error).message });
        failureCount++;
      }
    }

    return { successCount, failureCount, results };
  }

  /**
   * Move a membership to a different tier. Determines upgrade vs downgrade from
   * tier levels; future-dated changes are logged for scheduling rather than
   * applied immediately.
   */
  async changeTier(
    membershipId: string,
    newTierId: string,
    options: { effectiveDate?: Date; prorate?: boolean; notes?: string } = {},
  ): Promise<TierChangeResult> {
    if (!this.planLookup) {
      throw new Error('Plan lookup is not configured for tier changes');
    }

    const currentMembership = await this.membershipSubscriptionRepo.findById(membershipId);
    if (!currentMembership) {
      throw new Error('Current membership not found');
    }

    const newTier = await this.planLookup.findById(newTierId);
    if (!newTier) {
      throw new Error('New tier not found');
    }

    const effective = options.effectiveDate ?? new Date();
    const currentTier = await this.planLookup.findById(currentMembership.membershipPlanId);
    const isUpgrade = newTier.level > (currentTier?.level || 0);

    if (effective <= new Date()) {
      await this.membershipSubscriptionRepo.changePlan(
        membershipId,
        newTierId,
        options.notes || `Tier ${isUpgrade ? 'upgraded' : 'downgraded'} to ${newTier.name}`,
      );
    } else {
      logger.info('Scheduled tier change', { tierName: newTier.name, effectiveDate: effective.toISOString() });
    }

    return {
      isUpgrade,
      from: currentTier?.name,
      to: newTier.name,
      effective,
      prorated: Boolean(options.prorate && isUpgrade),
      scheduled: effective > new Date(),
    };
  }
}
