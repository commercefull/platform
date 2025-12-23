/**
 * RenewMembership Use Case
 *
 * Renews a membership for another billing period.
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface RenewMembershipInput {
  membershipId: string;
  paymentMethodId?: string;
  autoRenew?: boolean;
}

export interface RenewMembershipOutput {
  membershipId: string;
  status: string;
  renewedAt: string;
  newPeriodStart: string;
  newPeriodEnd: string;
  amount: number;
  paymentStatus: string;
}

export class RenewMembershipUseCase {
  constructor(private readonly membershipRepository: any) {}

  async execute(input: RenewMembershipInput): Promise<RenewMembershipOutput> {
    const { membershipId, paymentMethodId, autoRenew } = input;

    // Get current membership
    const membership = await this.membershipRepository.getMembershipById(membershipId);
    if (!membership) {
      throw new Error('Membership not found');
    }

    const validStatuses = ['active', 'expired', 'pending_cancellation'];
    if (!validStatuses.includes(membership.status)) {
      throw new Error(`Cannot renew membership with status: ${membership.status}`);
    }

    // If pending cancellation, reactivate
    if (membership.status === 'pending_cancellation') {
      await this.membershipRepository.updateMembership(membershipId, {
        status: 'active',
        scheduledCancellationDate: null,
        cancellationReason: null,
      });
    }

    // Get tier details for pricing
    const tier = await this.membershipRepository.getTierById(membership.tierId);
    if (!tier) {
      throw new Error('Membership tier not found');
    }

    const now = new Date();
    const newPeriodStart = membership.currentPeriodEnd
      ? new Date(Math.max(now.getTime(), new Date(membership.currentPeriodEnd).getTime()))
      : now;

    // Calculate new period end based on billing period
    const newPeriodEnd = new Date(newPeriodStart);
    switch (membership.billingPeriod || tier.billingPeriod) {
      case 'monthly':
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
        break;
      case 'quarterly':
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 3);
        break;
      case 'annual':
        newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
        break;
      default:
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
    }

    // Process payment
    let paymentStatus = 'pending';
    try {
      const payment = await this.processRenewalPayment(membership, tier.price, paymentMethodId || membership.defaultPaymentMethodId);
      paymentStatus = payment.status;
    } catch (error: any) {
      paymentStatus = 'failed';
      // Log failed payment but continue with renewal record
      await this.membershipRepository.createStatusLog({
        membershipId,
        previousStatus: membership.status,
        newStatus: membership.status,
        reason: 'renewal_payment_failed',
        changedAt: now,
        metadata: { error: error.message },
      });
    }

    // Update membership with new period
    await this.membershipRepository.updateMembership(membershipId, {
      status: paymentStatus === 'completed' ? 'active' : membership.status,
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: newPeriodEnd,
      renewedAt: now,
      autoRenew: autoRenew !== undefined ? autoRenew : membership.autoRenew,
      updatedAt: now,
    });

    // Log renewal
    await this.membershipRepository.createStatusLog({
      membershipId,
      previousStatus: membership.status,
      newStatus: 'active',
      reason: 'renewed',
      changedAt: now,
    });

    // Emit event
    await eventBus.emit('membership.renewed', {
      membershipId,
      customerId: membership.customerId,
      tierId: membership.tierId,
      amount: tier.price,
      paymentStatus,
      newPeriodEnd: newPeriodEnd.toISOString(),
    });

    return {
      membershipId,
      status: paymentStatus === 'completed' ? 'active' : membership.status,
      renewedAt: now.toISOString(),
      newPeriodStart: newPeriodStart.toISOString(),
      newPeriodEnd: newPeriodEnd.toISOString(),
      amount: tier.price,
      paymentStatus,
    };
  }

  private async processRenewalPayment(
    membership: any,
    amount: number,
    paymentMethodId?: string,
  ): Promise<{ status: string; transactionId?: string }> {
    // This would integrate with the payment module
    // For now, return a mock successful payment
    if (!paymentMethodId) {
      throw new Error('No payment method available');
    }

    // In real implementation, call payment service
    return {
      status: 'completed',
      transactionId: `renewal_${membership.membershipId}_${Date.now()}`,
    };
  }
}
