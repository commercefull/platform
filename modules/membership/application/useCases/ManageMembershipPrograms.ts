import membershipPlanRepository from '../../infrastructure/repositories/MembershipPlanRepository';

const adminProgramsRepo = membershipPlanRepository.admin;
const storefrontMembershipRepo = membershipPlanRepository.storefront;

export class ManageMembershipProgramsUseCase {
  async getMembershipStats() {
    return adminProgramsRepo.getMembershipStats();
  }
  async findMembershipTiersWithCounts() {
    return adminProgramsRepo.findMembershipTiersWithCounts();
  }
  async findRecentMemberships(limit?: number) {
    return adminProgramsRepo.findRecentMemberships(limit);
  }
  async getSubscriptionStats() {
    return adminProgramsRepo.getSubscriptionStats();
  }
  async findSubscriptionPlansWithCounts() {
    return adminProgramsRepo.findSubscriptionPlansWithCounts();
  }
  async findRecentSubscriptions(limit?: number) {
    return adminProgramsRepo.findRecentSubscriptions(limit);
  }
  async getLoyaltyStats() {
    return adminProgramsRepo.getLoyaltyStats();
  }
  async findLoyaltyRewardsWithCounts() {
    return adminProgramsRepo.findLoyaltyRewardsWithCounts();
  }
  async findRecentLoyaltyTransactions(limit?: number) {
    return adminProgramsRepo.findRecentLoyaltyTransactions(limit);
  }
}

export class ManageStorefrontMembershipUseCase {
  async findActivePlansWithBenefitCount() {
    return storefrontMembershipRepo.findActivePlansWithBenefitCount();
  }
  async findPlanById(planId: string) {
    return storefrontMembershipRepo.findPlanById(planId);
  }
  async findBenefitsByPlanId(planId: string) {
    return storefrontMembershipRepo.findBenefitsByPlanId(planId);
  }
  async findActiveMembershipWithPlan(customerId: string) {
    return storefrontMembershipRepo.findActiveMembershipWithPlan(customerId);
  }
  async findActiveMembershipByCustomerId(customerId: string) {
    return storefrontMembershipRepo.findActiveMembershipByCustomerId(customerId);
  }
  async createMembership(customerId: string, planId: string) {
    return storefrontMembershipRepo.createMembership(customerId, planId);
  }
}
