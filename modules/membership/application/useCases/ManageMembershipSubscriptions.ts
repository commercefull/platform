import type { MembershipSubscription } from '../../../../libs/db/types';

export interface MembershipSubscriptionsPort {
  findById(id: string): Promise<MembershipSubscription | null>;
  changePlan(membershipId: string, newPlanId: string, notes?: string): Promise<unknown>;
  pause(membershipId: string): Promise<unknown>;
  resume(membershipId: string): Promise<unknown>;
  cancel(membershipId: string): Promise<unknown>;
}


export class ManageMembershipSubscriptionsUseCase {
  constructor(private readonly membershipSubscriptionRepo: MembershipSubscriptionsPort) {}

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
}
