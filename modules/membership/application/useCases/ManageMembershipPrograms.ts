export interface MembershipAdminProgramsPort {
  getMembershipStats(): Promise<{ totalMembers: number; activeMembers: number; expiringThisMonth: number }>;
  findMembershipTiersWithCounts(): Promise<unknown[]>;
  findRecentMemberships(limit?: number): Promise<unknown[]>;
  getSubscriptionStats(): Promise<{ totalSubscriptions: number; activeSubscriptions: number; mrr: number }>;
  findSubscriptionPlansWithCounts(): Promise<unknown[]>;
  findRecentSubscriptions(limit?: number): Promise<unknown[]>;
  getLoyaltyStats(): Promise<{ totalMembers: number; totalPointsIssued: number; totalPointsRedeemed: number }>;
  findLoyaltyRewardsWithCounts(): Promise<unknown[]>;
  findRecentLoyaltyTransactions(limit?: number): Promise<unknown[]>;
}


export class ManageMembershipProgramsUseCase {
  constructor(private readonly adminProgramsRepo: MembershipAdminProgramsPort) {}

  async getMembershipStats() {
    return this.adminProgramsRepo.getMembershipStats();
  }
  async findMembershipTiersWithCounts() {
    return this.adminProgramsRepo.findMembershipTiersWithCounts();
  }
  async findRecentMemberships(limit?: number) {
    return this.adminProgramsRepo.findRecentMemberships(limit);
  }
  async getSubscriptionStats() {
    return this.adminProgramsRepo.getSubscriptionStats();
  }
  async findSubscriptionPlansWithCounts() {
    return this.adminProgramsRepo.findSubscriptionPlansWithCounts();
  }
  async findRecentSubscriptions(limit?: number) {
    return this.adminProgramsRepo.findRecentSubscriptions(limit);
  }
  async getLoyaltyStats() {
    return this.adminProgramsRepo.getLoyaltyStats();
  }
  async findLoyaltyRewardsWithCounts() {
    return this.adminProgramsRepo.findLoyaltyRewardsWithCounts();
  }
  async findRecentLoyaltyTransactions(limit?: number) {
    return this.adminProgramsRepo.findRecentLoyaltyTransactions(limit);
  }
}

