/**
 * AssignMembership Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface AssignMembershipInput {
  customerId: string;
  tierId: string;
  paymentMethodId?: string;
  startDate?: Date;
  source?: 'purchase' | 'upgrade' | 'gift' | 'points_redemption' | 'admin';
}

export interface AssignMembershipOutput {
  membershipId: string;
  customerId: string;
  tierId: string;
  tierName: string;
  status: string;
  startDate: string;
  endDate?: string;
}

export class AssignMembershipUseCase {
  constructor(private readonly membershipRepository: any) {}

  async execute(input: AssignMembershipInput): Promise<AssignMembershipOutput> {
    // Validate tier exists
    const tier = await this.membershipRepository.findTierById(input.tierId);
    if (!tier) {
      throw new Error(`Membership tier not found: ${input.tierId}`);
    }

    if (!tier.isActive) {
      throw new Error('This membership tier is not currently available');
    }

    // Check if customer already has active membership
    const existingMembership = await this.membershipRepository.findActiveByCustomerId(input.customerId);
    if (existingMembership) {
      throw new Error('Customer already has an active membership. Use upgrade instead.');
    }

    // Check tier capacity
    if (tier.maxMembers && tier.currentMembers >= tier.maxMembers) {
      throw new Error('This membership tier has reached maximum capacity');
    }

    const membershipId = `mbr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    const startDate = input.startDate || new Date();
    
    // Calculate end date based on billing period
    let endDate: Date | undefined;
    if (tier.billingPeriod && tier.billingPeriod !== 'lifetime') {
      endDate = new Date(startDate);
      switch (tier.billingPeriod) {
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'quarterly':
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case 'yearly':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }
    }

    const membership = await this.membershipRepository.createMembership({
      membershipId,
      customerId: input.customerId,
      tierId: input.tierId,
      status: 'active',
      startDate,
      endDate,
      paymentMethodId: input.paymentMethodId,
      source: input.source || 'purchase',
      autoRenew: tier.price ? true : false,
    });

    // Update tier member count
    await this.membershipRepository.incrementTierMembers(input.tierId);

    eventBus.emit('membership.assigned', {
      membershipId,
      customerId: input.customerId,
      tierId: input.tierId,
      tierName: tier.name,
    });

    return {
      membershipId: membership.membershipId,
      customerId: membership.customerId,
      tierId: membership.tierId,
      tierName: tier.name,
      status: membership.status,
      startDate: membership.startDate.toISOString(),
      endDate: membership.endDate?.toISOString(),
    };
  }
}
