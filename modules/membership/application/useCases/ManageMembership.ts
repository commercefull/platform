import membershipPlanRepository from '../../infrastructure/repositories/MembershipPlanRepository';
import membershipSubscriptionDataRepository from '../../infrastructure/repositories/MembershipSubscriptionDataRepository';
import type { MembershipSubscription } from '../../infrastructure/repositories/MembershipSubscriptionDataRepository';

const membershipPlanRepo = membershipPlanRepository.plans;
const membershipSubscriptionRepo = membershipSubscriptionDataRepository.subscriptions;
const membershipBenefitRepo = membershipPlanRepository.benefits;
const membershipPlanBenefitRepo = membershipPlanRepository.planBenefits;

export class ManageMembershipPlansUseCase {
  async findAll(activeOnly?: boolean) {
    return membershipPlanRepo.findAll(activeOnly);
  }
  async findById(id: string) {
    return membershipPlanRepo.findById(id);
  }
  async getStatistics() {
    return membershipPlanRepo.getStatistics();
  }
  async create(params: Parameters<typeof membershipPlanRepo.create>[0]) {
    return membershipPlanRepo.create(params);
  }
  async update(id: string, updates: Record<string, unknown>) {
    return membershipPlanRepo.update(id, updates);
  }
  async activate(id: string) {
    return membershipPlanRepo.activate(id);
  }
  async deactivate(id: string) {
    return membershipPlanRepo.deactivate(id);
  }
  async remove(id: string) {
    return membershipPlanRepo.remove(id);
  }
}

export class ManageMembershipBenefitsUseCase {
  private benefitRepo = membershipBenefitRepo;
  private planBenefitRepo = membershipPlanBenefitRepo;

  async findAll(activeOnly?: boolean) {
    return this.benefitRepo.findAll(activeOnly);
  }
  async findByPlanId(planId: string, activeOnly?: boolean) {
    return this.benefitRepo.findByPlanId(planId, activeOnly);
  }
  async findById(id: string) {
    return this.benefitRepo.findById(id);
  }
  async findPlanBenefits(planId: string, activeOnly?: boolean) {
    return this.planBenefitRepo.findByPlanId(planId, activeOnly);
  }
}

export class ManageMembershipSubscriptionsUseCase {
  async findById(id: string): Promise<MembershipSubscription | null> {
    return membershipSubscriptionRepo.findById(id);
  }
  async changePlan(membershipId: string, newPlanId: string, notes?: string) {
    return membershipSubscriptionRepo.changePlan(membershipId, newPlanId, notes);
  }
  async pause(membershipId: string) {
    return membershipSubscriptionRepo.pause(membershipId);
  }
  async resume(membershipId: string) {
    return membershipSubscriptionRepo.resume(membershipId);
  }
  async cancel(membershipId: string) {
    return membershipSubscriptionRepo.cancel(membershipId);
  }
}
