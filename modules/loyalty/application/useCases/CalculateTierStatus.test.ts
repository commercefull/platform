jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { CalculateTierStatusUseCase} from './CalculateTierStatus';
import { LoyaltyMemberNotFoundError } from '../../domain/errors/LoyaltyErrors';

describe('CalculateTierStatusUseCase', () => {
  let useCase: CalculateTierStatusUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      getCustomerLoyalty: jest.fn().mockResolvedValue({ currentTier: { tierId: 't1', name: 'Silver', level: 1, pointsThreshold: 500, purchasesThreshold: 5, benefits: [], pointsMultiplier: 1.2 } }),
      getTiers: jest.fn().mockResolvedValue([
        { tierId: 't1', name: 'Silver', level: 1, pointsThreshold: 500, purchasesThreshold: 5, benefits: [], pointsMultiplier: 1.2 },
        { tierId: 't2', name: 'Gold', level: 2, pointsThreshold: 1000, purchasesThreshold: 10, benefits: [], pointsMultiplier: 1.5 },
      ]),
      getQualificationPeriod: jest.fn().mockResolvedValue({ startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') }),
      getQualifyingMetrics: jest.fn().mockResolvedValue({ points: 1200, purchases: 12 }),
      updateCustomerTier: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new CalculateTierStatusUseCase(mockRepo as never);
  });

  it('should calculate tier status (happy path)', async () => {
    const result = await useCase.execute({ customerId: 'c1' });

    expect(result.tierChanged).toBe(true);
    expect(result.changeType).toBe('upgraded');
    expect(result.currentTier.tierName).toBe('Gold');
  });

  it('should throw LoyaltyMemberNotFoundError when customer not found', async () => {
    mockRepo.getCustomerLoyalty.mockResolvedValue(null);

    await expect(useCase.execute({ customerId: 'missing' })).rejects.toThrow(LoyaltyMemberNotFoundError);
  });
});
