import '../../tests/testUtils';
import { CalculateTierStatusUseCase } from './CalculateTierStatus';
import { LoyaltyMemberNotFoundError } from '../../domain/errors/LoyaltyErrors';
import { createTierStatusRepository, emitMock } from '../../tests/testUtils';

describe('CalculateTierStatusUseCase', () => {
  const loyaltyRepository = createTierStatusRepository();
  const useCase = new CalculateTierStatusUseCase(loyaltyRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    loyaltyRepository.getCustomerLoyalty.mockResolvedValue({
      currentTier: {
        tierId: 't1',
        name: 'Silver',
        level: 1,
        pointsThreshold: 500,
        purchasesThreshold: 5,
        benefits: [],
        pointsMultiplier: 1.2,
      },
    });
    loyaltyRepository.getTiers.mockResolvedValue([
      { tierId: 't1', name: 'Silver', level: 1, pointsThreshold: 500, purchasesThreshold: 5, benefits: [], pointsMultiplier: 1.2 },
      { tierId: 't2', name: 'Gold', level: 2, pointsThreshold: 1000, purchasesThreshold: 10, benefits: [], pointsMultiplier: 1.5 },
    ]);
    loyaltyRepository.getQualificationPeriod.mockResolvedValue({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    });
    loyaltyRepository.getQualifyingMetrics.mockResolvedValue({ points: 1200, purchases: 12 });
    loyaltyRepository.updateCustomerTier.mockResolvedValue(undefined);
  });

  it('should upgrade the tier and emit loyalty.tier_upgraded when the customer qualifies', async () => {
    const result = await useCase.execute({ customerId: 'c1' });

    expect(result.tierChanged).toBe(true);
    expect(result.changeType).toBe('upgraded');
    expect(result.currentTier.tierName).toBe('Gold');
    expect(loyaltyRepository.updateCustomerTier).toHaveBeenCalledWith('c1', 't2');
    expect(emitMock).toHaveBeenCalledWith(
      'loyalty.tier_upgraded',
      expect.objectContaining({ customerId: 'c1' }),
    );
  });

  it('should throw LoyaltyMemberNotFoundError when the customer has no membership', async () => {
    loyaltyRepository.getCustomerLoyalty.mockResolvedValue(null);

    await expect(useCase.execute({ customerId: 'missing' })).rejects.toThrow(LoyaltyMemberNotFoundError);
    expect(emitMock).not.toHaveBeenCalled();
  });
});
