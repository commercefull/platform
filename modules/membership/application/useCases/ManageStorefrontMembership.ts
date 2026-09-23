export interface MembershipStorefrontPort {
  findActivePlansWithBenefitCount(): Promise<unknown[]>;
  findPlanById(planId: string): Promise<unknown | null>;
  findBenefitsByPlanId(planId: string): Promise<unknown[]>;
  findActiveMembershipWithPlan(customerId: string): Promise<unknown | null>;
  findActiveMembershipByCustomerId(customerId: string): Promise<unknown | null>;
  createMembership(customerId: string, planId: string): Promise<void>;
}

export class ManageStorefrontMembershipUseCase {
  constructor(private readonly storefrontRepo: MembershipStorefrontPort) {}

  async findActivePlansWithBenefitCount() {
    return this.storefrontRepo.findActivePlansWithBenefitCount();
  }
  async findPlanById(planId: string) {
    return this.storefrontRepo.findPlanById(planId);
  }
  async findBenefitsByPlanId(planId: string) {
    return this.storefrontRepo.findBenefitsByPlanId(planId);
  }
  async findActiveMembershipWithPlan(customerId: string) {
    return this.storefrontRepo.findActiveMembershipWithPlan(customerId);
  }
  async findActiveMembershipByCustomerId(customerId: string) {
    return this.storefrontRepo.findActiveMembershipByCustomerId(customerId);
  }
  async createMembership(customerId: string, planId: string) {
    return this.storefrontRepo.createMembership(customerId, planId);
  }
}
