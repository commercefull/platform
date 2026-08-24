jest.mock('../../infrastructure/repositories/LoyaltyDataRepository', () => ({
  __esModule: true,
  default: {
    points: {
      findAllTiers: jest.fn().mockResolvedValue([{ tierId: 't1' }]),
      findTierById: jest.fn().mockResolvedValue({ tierId: 't1' }),
      createTier: jest.fn().mockResolvedValue({ tierId: 't2' }),
      updateTier: jest.fn().mockResolvedValue(undefined),
      deleteTier: jest.fn().mockResolvedValue(undefined),
      findAllRewards: jest.fn().mockResolvedValue([{ rewardId: 'r1' }]),
      findRewardById: jest.fn().mockResolvedValue({ rewardId: 'r1' }),
      createReward: jest.fn().mockResolvedValue({ rewardId: 'r2' }),
      updateReward: jest.fn().mockResolvedValue(undefined),
      deleteReward: jest.fn().mockResolvedValue(undefined),
      findCustomerPointsWithTier: jest.fn().mockResolvedValue({ points: { currentPoints: 500 }, tier: { tierId: 't1' } }),
      findCustomerTransactions: jest.fn().mockResolvedValue([{ transactionId: 't1' }]),
      findCustomerRedemptions: jest.fn().mockResolvedValue([{ redemptionId: 'red1' }]),
    },
    storefront: {
      findMemberWithTier: jest.fn().mockResolvedValue({ memberId: 'm1' }),
      findCustomerTransactions: jest.fn().mockResolvedValue([{ transactionId: 't1' }]),
      countCustomerTransactions: jest.fn().mockResolvedValue(5),
      findAvailableRewards: jest.fn().mockResolvedValue([{ rewardId: 'r1' }]),
      findRewardById: jest.fn().mockResolvedValue({ rewardId: 'r1' }),
      findMemberByCustomerId: jest.fn().mockResolvedValue({ memberId: 'm1' }),
      deductPoints: jest.fn().mockResolvedValue(undefined),
      createRedeemTransaction: jest.fn().mockResolvedValue({ transactionId: 't2' }),
    },
  },
}));

import { ManageLoyaltyAdminUseCase, ManageStorefrontLoyaltyUseCase } from './ManageLoyalty';
import loyaltyDataRepository from '../../infrastructure/repositories/LoyaltyDataRepository';

const mockRepo = loyaltyDataRepository as unknown as { points: Record<string, jest.Mock>; storefront: Record<string, jest.Mock> };

describe('ManageLoyaltyAdminUseCase', () => {
  let useCase: ManageLoyaltyAdminUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageLoyaltyAdminUseCase();
  });

  it('should find all tiers', async () => {
    const result = await useCase.findAllTiers(true);
    expect(result).toHaveLength(1);
  });

  it('should create tier', async () => {
    const result = await useCase.createTier({ name: 'Gold' } as never);
    expect(result).toEqual({ tierId: 't2' });
  });

  it('should find customer points with tier', async () => {
    const result = await useCase.findCustomerPointsWithTier('c1');
    expect(result?.points?.currentPoints).toBe(500);
  });

  it('should find customer redemptions', async () => {
    const result = await useCase.findCustomerRedemptions('c1', 10);
    expect(result).toHaveLength(1);
  });
});

describe('ManageStorefrontLoyaltyUseCase', () => {
  let useCase: ManageStorefrontLoyaltyUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageStorefrontLoyaltyUseCase();
  });

  it('should find member with tier', async () => {
    const result = await useCase.findMemberWithTier('c1');
    expect(result).toEqual({ memberId: 'm1' });
  });

  it('should count customer transactions', async () => {
    const result = await useCase.countCustomerTransactions('c1');
    expect(result).toBe(5);
  });

  it('should find available rewards', async () => {
    const result = await useCase.findAvailableRewards(500);
    expect(result).toHaveLength(1);
  });

  it('should deduct points', async () => {
    await useCase.deductPoints('c1', 100);
    expect(mockRepo.storefront.deductPoints).toHaveBeenCalledWith('c1', 100);
  });
});
