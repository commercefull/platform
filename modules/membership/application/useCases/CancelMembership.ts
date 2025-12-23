/**
 * CancelMembership Use Case
 * 
 * Cancels a customer's membership.
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface CancelMembershipInput {
  membershipId: string;
  reason?: string;
  feedback?: string;
  immediate?: boolean;
  cancelledBy?: string;
}

export interface CancelMembershipOutput {
  membershipId: string;
  status: string;
  cancelledAt: string;
  effectiveEndDate: string;
  refundEligible: boolean;
  refundAmount?: number;
}

export class CancelMembershipUseCase {
  constructor(private readonly membershipRepository: any) {}

  async execute(input: CancelMembershipInput): Promise<CancelMembershipOutput> {
    const { membershipId, reason, feedback, immediate = false, cancelledBy } = input;

    // Get current membership
    const membership = await this.membershipRepository.getMembershipById(membershipId);
    if (!membership) {
      throw new Error('Membership not found');
    }

    if (membership.status === 'cancelled') {
      throw new Error('Membership is already cancelled');
    }

    const now = new Date();
    let effectiveEndDate: Date;
    let refundAmount: number | undefined;
    let refundEligible = false;

    if (immediate) {
      // Immediate cancellation
      effectiveEndDate = now;
      
      // Calculate potential refund for unused period
      if (membership.currentPeriodEnd) {
        const periodEnd = new Date(membership.currentPeriodEnd);
        const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        
        if (daysRemaining > 0) {
          const tier = await this.membershipRepository.getTierById(membership.tierId);
          const daysInPeriod = membership.billingPeriod === 'monthly' ? 30 : membership.billingPeriod === 'quarterly' ? 90 : 365;
          refundAmount = (tier.price / daysInPeriod) * daysRemaining;
          refundEligible = refundAmount > 0;
        }
      }

      await this.membershipRepository.updateMembership(membershipId, {
        status: 'cancelled',
        cancelledAt: now,
        cancellationReason: reason,
        cancellationFeedback: feedback,
        cancelledBy,
        updatedAt: now,
      });
    } else {
      // Cancel at end of billing period
      effectiveEndDate = membership.currentPeriodEnd ? new Date(membership.currentPeriodEnd) : now;
      
      await this.membershipRepository.updateMembership(membershipId, {
        status: 'pending_cancellation',
        scheduledCancellationDate: effectiveEndDate,
        cancellationReason: reason,
        cancellationFeedback: feedback,
        cancelledBy,
        updatedAt: now,
      });
    }

    // Log status change
    await this.membershipRepository.createStatusLog({
      membershipId,
      previousStatus: membership.status,
      newStatus: immediate ? 'cancelled' : 'pending_cancellation',
      reason: reason || 'user_requested',
      changedAt: now,
      changedBy: cancelledBy,
    });

    // Record cancellation feedback if provided
    if (feedback) {
      await this.membershipRepository.recordCancellationFeedback({
        membershipId,
        customerId: membership.customerId,
        tierId: membership.tierId,
        reason,
        feedback,
        membershipDuration: this.calculateMembershipDuration(membership.createdAt, now),
        createdAt: now,
      });
    }

    // Emit event
    await eventBus.emit('membership.cancelled', {
      membershipId,
      customerId: membership.customerId,
      tierId: membership.tierId,
      reason,
      immediate,
      effectiveEndDate: effectiveEndDate.toISOString(),
      refundEligible,
      refundAmount,
    });

    return {
      membershipId,
      status: immediate ? 'cancelled' : 'pending_cancellation',
      cancelledAt: now.toISOString(),
      effectiveEndDate: effectiveEndDate.toISOString(),
      refundEligible,
      refundAmount,
    };
  }

  private calculateMembershipDuration(startDate: Date, endDate: Date): number {
    return Math.floor((endDate.getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
  }
}
