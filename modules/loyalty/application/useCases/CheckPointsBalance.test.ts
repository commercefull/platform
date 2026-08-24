import { CheckPointsBalanceUseCase} from './CheckPointsBalance';

describe('CheckPointsBalanceUseCase', () => {
  let useCase: CheckPointsBalanceUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findMemberByCustomerId: jest.fn().mockResolvedValue({
        availablePoints: 500, pendingPoints: 50, lifetimePoints: 1000,
        tier: { tierId: 't1', name: 'Gold', multiplier: 1.5 },
      }),
      findNextTier: jest.fn().mockResolvedValue({ name: 'Platinum', requiredPoints: 2000 }),
    };
    useCase = new CheckPointsBalanceUseCase(mockRepo as never);
  });

  it('should check points balance (happy path)', async () => {
    const result = await useCase.execute({ customerId: 'c1' });

    expect(result.availablePoints).toBe(500);
    expect(result.tierName).toBe('Gold');
    expect(result.tierMultiplier).toBe(1.5);
    expect(result.nextTierName).toBe('Platinum');
    expect(result.pointsToNextTier).toBe(1000);
  });

  it('should return zero balance for non-members', async () => {
    mockRepo.findMemberByCustomerId.mockResolvedValue(null);

    const result = await useCase.execute({ customerId: 'non-member' });

    expect(result.availablePoints).toBe(0);
    expect(result.tierName).toBe('Non-member');
  });
});
