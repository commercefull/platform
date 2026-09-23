import '../../tests/testUtils';
import { ManageLoyaltyAdminUseCase } from './ManageLoyaltyAdmin';
import {
  createLoyaltyRepository,
  createLoyaltyTier,
  createLoyaltyPoints,
  createLoyaltyRedemption,
} from '../../tests/testUtils';

describe('ManageLoyaltyAdminUseCase', () => {
  const loyaltyRepository = createLoyaltyRepository();
  const useCase = new ManageLoyaltyAdminUseCase(loyaltyRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all tiers including inactive when requested', async () => {
    loyaltyRepository.findAllTiers.mockResolvedValue([createLoyaltyTier()]);

    const result = await useCase.findAllTiers(true);

    expect(result).toHaveLength(1);
    expect(loyaltyRepository.findAllTiers).toHaveBeenCalledWith(true);
  });

  it('should delegate tier creation to the repository', async () => {
    loyaltyRepository.createTier.mockResolvedValue(createLoyaltyTier({ tierId: 't2', name: 'Gold' }));
    const input = { name: 'Gold', type: 'points', pointsThreshold: 1000, multiplier: 1.5 };

    const result = await useCase.createTier(input);

    expect(result.tierId).toBe('t2');
    expect(loyaltyRepository.createTier).toHaveBeenCalledWith(input);
  });

  it('should return customer points with tier information', async () => {
    loyaltyRepository.findCustomerPointsWithTier.mockResolvedValue({
      points: createLoyaltyPoints({ currentPoints: 500 }),
      tier: createLoyaltyTier(),
    });

    const result = await useCase.findCustomerPointsWithTier('c1');

    expect(result?.points?.currentPoints).toBe(500);
  });

  it('should return customer redemptions with the given limit', async () => {
    loyaltyRepository.findCustomerRedemptions.mockResolvedValue([createLoyaltyRedemption()]);

    const result = await useCase.findCustomerRedemptions('c1', 10);

    expect(result).toHaveLength(1);
    expect(loyaltyRepository.findCustomerRedemptions).toHaveBeenCalledWith('c1', 10);
  });
});

