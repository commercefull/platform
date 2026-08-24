jest.mock('../../infrastructure/repositories/MembershipPlanRepository', () => ({
  __esModule: true,
  default: {
    admin: {
      getMembershipStats: jest.fn().mockResolvedValue({ totalMembers: 10, activeMembers: 8, expiringThisMonth: 2 }),
      findMembershipTiersWithCounts: jest.fn().mockResolvedValue([{ tierId: 't1' }]),
      findRecentMemberships: jest.fn().mockResolvedValue([{ membershipId: 'm1' }]),
      getSubscriptionStats: jest.fn().mockResolvedValue({ total: 5 }),
      findSubscriptionPlansWithCounts: jest.fn().mockResolvedValue([{ planId: 'p1' }]),
      findRecentSubscriptions: jest.fn().mockResolvedValue([{ subscriptionId: 's1' }]),
      getLoyaltyStats: jest.fn().mockResolvedValue({ totalMembers: 20, totalPointsIssued: 1000, totalPointsRedeemed: 500 }),
      findLoyaltyRewardsWithCounts: jest.fn().mockResolvedValue([{ rewardId: 'r1' }]),
      findRecentLoyaltyTransactions: jest.fn().mockResolvedValue([{ transactionId: 'lt1' }]),
    },
    storefront: {
      findActivePlansWithBenefitCount: jest.fn().mockResolvedValue([{ planId: 'p1' }]),
      findPlanById: jest.fn().mockResolvedValue({ planId: 'p1' }),
      findBenefitsByPlanId: jest.fn().mockResolvedValue([{ benefitId: 'b1' }]),
      findActiveMembershipWithPlan: jest.fn().mockResolvedValue({ membershipId: 'm1' }),
      findActiveMembershipByCustomerId: jest.fn().mockResolvedValue({ membershipId: 'm1' }),
      createMembership: jest.fn().mockResolvedValue({ membershipId: 'm2' }),
    },
  },
}));

import { ManageMembershipProgramsUseCase, ManageStorefrontMembershipUseCase } from './ManageMembershipPrograms';

describe('ManageMembershipProgramsUseCase', () => {
  let useCase: ManageMembershipProgramsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageMembershipProgramsUseCase();
  });

  it('should get membership stats', async () => {
    const result = await useCase.getMembershipStats();
    expect(result.totalMembers).toBe(10);
  });

  it('should find membership tiers with counts', async () => {
    const result = await useCase.findMembershipTiersWithCounts();
    expect(result).toHaveLength(1);
  });

  it('should get loyalty stats', async () => {
    const result = await useCase.getLoyaltyStats();
    expect(result.totalMembers).toBe(20);
  });
});

describe('ManageStorefrontMembershipUseCase', () => {
  let useCase: ManageStorefrontMembershipUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageStorefrontMembershipUseCase();
  });

  it('should find active plans with benefit count', async () => {
    const result = await useCase.findActivePlansWithBenefitCount();
    expect(result).toHaveLength(1);
  });

  it('should find plan by ID', async () => {
    const result = await useCase.findPlanById('p1');
    expect(result).toEqual({ planId: 'p1' });
  });

  it('should create membership', async () => {
    const result = await useCase.createMembership('c1', 'p1');
    expect(result).toEqual({ membershipId: 'm2' });
  });
});
