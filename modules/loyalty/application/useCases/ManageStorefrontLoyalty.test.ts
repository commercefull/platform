import '../../tests/testUtils';
import { ManageStorefrontLoyaltyUseCase } from './ManageStorefrontLoyalty';
import {
  createLoyaltyRepository,
  createLoyaltyReward,
} from '../../tests/testUtils';

describe('ManageStorefrontLoyaltyUseCase', () => {
  const storefrontLoyaltyRepository = createLoyaltyRepository();
  const useCase = new ManageStorefrontLoyaltyUseCase(storefrontLoyaltyRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the member with tier information', async () => {
    storefrontLoyaltyRepository.findMemberWithTier.mockResolvedValue({ memberId: 'm1' });

    const result = await useCase.findMemberWithTier('c1');

    expect(result).toEqual({ memberId: 'm1' });
  });

  it('should return the customer transaction count', async () => {
    storefrontLoyaltyRepository.countCustomerTransactions.mockResolvedValue(5);

    const result = await useCase.countCustomerTransactions('c1');

    expect(result).toBe(5);
  });

  it('should return rewards available at the given points balance', async () => {
    storefrontLoyaltyRepository.findAvailableRewards.mockResolvedValue([createLoyaltyReward()]);

    const result = await useCase.findAvailableRewards(500);

    expect(result).toHaveLength(1);
    expect(storefrontLoyaltyRepository.findAvailableRewards).toHaveBeenCalledWith(500);
  });

  it('should deduct points through the repository', async () => {
    storefrontLoyaltyRepository.deductPoints.mockResolvedValue(undefined);

    await useCase.deductPoints('c1', 100);

    expect(storefrontLoyaltyRepository.deductPoints).toHaveBeenCalledWith('c1', 100);
  });
});
