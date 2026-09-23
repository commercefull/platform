import '../../tests/testUtils';
import { RedeemPointsUseCase } from './RedeemPoints';
import {
  LoyaltyMemberNotFoundError,
  LoyaltyRewardNotFoundError,
  RewardNotAvailableError,
  InsufficientPointsError,
  LoyaltyValidationError,
} from '../../domain/errors/LoyaltyErrors';
import { createRedeemPointsRepositories, emitMock } from '../../tests/testUtils';

describe('RedeemPointsUseCase', () => {
  const { loyaltyRepository, rewardRepository } = createRedeemPointsRepositories();
  const useCase = new RedeemPointsUseCase(loyaltyRepository, rewardRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    loyaltyRepository.findMemberByCustomerId.mockResolvedValue({ memberId: 'm1', availablePoints: 500 });
    loyaltyRepository.createTransaction.mockResolvedValue(undefined);
    loyaltyRepository.updateMemberPoints.mockResolvedValue(undefined);
    rewardRepository.findById.mockResolvedValue({
      isActive: true,
      pointsCost: 100,
      discountValue: 10,
      name: '10% Off',
    });
  });

  it('should redeem points, update the balance and emit loyalty.points_redeemed', async () => {
    const result = await useCase.execute({ customerId: 'c1', points: 100 });

    expect(result.pointsRedeemed).toBe(100);
    expect(result.newBalance).toBe(400);
    expect(loyaltyRepository.updateMemberPoints).toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith(
      'loyalty.points_redeemed',
      expect.objectContaining({ customerId: 'c1', points: 100 }),
    );
  });

  it('should return the reward discount value when redeeming for a reward', async () => {
    const result = await useCase.execute({ customerId: 'c1', points: 100, rewardId: 'rwd1' });

    expect(result.discountValue).toBe(10);
  });

  it('should throw LoyaltyMemberNotFoundError when the member does not exist', async () => {
    loyaltyRepository.findMemberByCustomerId.mockResolvedValue(null);

    await expect(useCase.execute({ customerId: 'missing', points: 10 })).rejects.toThrow(LoyaltyMemberNotFoundError);
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should throw InsufficientPointsError when the balance is too low', async () => {
    await expect(useCase.execute({ customerId: 'c1', points: 600 })).rejects.toThrow(InsufficientPointsError);
    expect(loyaltyRepository.updateMemberPoints).not.toHaveBeenCalled();
  });

  it('should throw LoyaltyRewardNotFoundError when the reward does not exist', async () => {
    rewardRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ customerId: 'c1', points: 100, rewardId: 'missing' })).rejects.toThrow(
      LoyaltyRewardNotFoundError,
    );
  });

  it('should throw RewardNotAvailableError when the reward is inactive', async () => {
    rewardRepository.findById.mockResolvedValue({ isActive: false, pointsCost: 100, name: 'Test' });

    await expect(useCase.execute({ customerId: 'c1', points: 100, rewardId: 'rwd1' })).rejects.toThrow(
      RewardNotAvailableError,
    );
  });

  it('should throw LoyaltyValidationError when the reward requires more points than given', async () => {
    rewardRepository.findById.mockResolvedValue({ isActive: true, pointsCost: 200, name: 'Expensive' });

    await expect(useCase.execute({ customerId: 'c1', points: 100, rewardId: 'rwd1' })).rejects.toThrow(
      LoyaltyValidationError,
    );
  });
});
