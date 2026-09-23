import '../../tests/testUtils';
import { CheckPointsBalanceUseCase } from './CheckPointsBalance';
import { createPointsBalanceRepository } from '../../tests/testUtils';

describe('CheckPointsBalanceUseCase', () => {
  const loyaltyRepository = createPointsBalanceRepository();
  const useCase = new CheckPointsBalanceUseCase(loyaltyRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    loyaltyRepository.findMemberByCustomerId.mockResolvedValue({
      availablePoints: 500,
      pendingPoints: 50,
      lifetimePoints: 1000,
      tier: { tierId: 't1', name: 'Gold', multiplier: 1.5 },
    });
    loyaltyRepository.findNextTier.mockResolvedValue({ name: 'Platinum', requiredPoints: 2000 });
  });

  it('should return the balance with tier and next-tier progress for a member', async () => {
    const result = await useCase.execute({ customerId: 'c1' });

    expect(result.availablePoints).toBe(500);
    expect(result.tierName).toBe('Gold');
    expect(result.tierMultiplier).toBe(1.5);
    expect(result.nextTierName).toBe('Platinum');
    expect(result.pointsToNextTier).toBe(1000);
  });

  it('should return a zero balance when the customer is not a member', async () => {
    loyaltyRepository.findMemberByCustomerId.mockResolvedValue(null);

    const result = await useCase.execute({ customerId: 'non-member' });

    expect(result.availablePoints).toBe(0);
    expect(result.tierName).toBe('Non-member');
  });
});
