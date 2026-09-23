import '../../tests/testUtils';
import { EarnPointsUseCase } from './EarnPoints';
import { LoyaltyProgramNotFoundError } from '../../domain/errors/LoyaltyErrors';
import { createEarnPointsRepositories, emitMock } from '../../tests/testUtils';

describe('EarnPointsUseCase', () => {
  const { loyaltyRepository, programRepository } = createEarnPointsRepositories();
  const useCase = new EarnPointsUseCase(loyaltyRepository, programRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    loyaltyRepository.findMemberByCustomerId.mockResolvedValue({
      memberId: 'm1',
      tierId: 't1',
      availablePoints: 100,
      lifetimePoints: 200,
      tier: { multiplier: 1.5 },
    });
    loyaltyRepository.createMember.mockResolvedValue({
      memberId: 'm1',
      tierId: 't1',
      availablePoints: 0,
      lifetimePoints: 0,
    });
    loyaltyRepository.createTransaction.mockResolvedValue(undefined);
    loyaltyRepository.updateMemberPoints.mockResolvedValue(undefined);
    programRepository.findActive.mockResolvedValue({ programId: 'p1', defaultTierId: 't1', baseEarnRate: 1 });
  });

  it('should earn multiplied points and emit loyalty.points_earned for a purchase', async () => {
    const result = await useCase.execute({ customerId: 'c1', actionType: 'purchase', amount: 100 });

    expect(result.pointsEarned).toBe(150);
    expect(result.newBalance).toBe(250);
    expect(loyaltyRepository.updateMemberPoints).toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith(
      'loyalty.points_earned',
      expect.objectContaining({ customerId: 'c1', points: 150 }),
    );
  });

  it('should apply the tier multiplier to fixed points for a non-purchase action', async () => {
    const result = await useCase.execute({ customerId: 'c1', actionType: 'review', points: 50 });

    expect(result.pointsEarned).toBe(75);
  });

  it('should create a member when the customer has no membership', async () => {
    loyaltyRepository.findMemberByCustomerId.mockResolvedValue(null);

    const result = await useCase.execute({ customerId: 'c2', actionType: 'signup', points: 100 });

    expect(loyaltyRepository.createMember).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'c2', tierId: 't1', programId: 'p1' }),
    );
    expect(result.pointsEarned).toBe(100);
  });

  it('should throw LoyaltyProgramNotFoundError when there is no active program', async () => {
    programRepository.findActive.mockResolvedValue(null);

    await expect(useCase.execute({ customerId: 'c1', actionType: 'bonus', points: 10 })).rejects.toThrow(
      LoyaltyProgramNotFoundError,
    );
    expect(emitMock).not.toHaveBeenCalled();
  });
});
