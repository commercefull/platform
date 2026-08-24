jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { RedeemPointsUseCase} from './RedeemPoints';
import {
  LoyaltyMemberNotFoundError, LoyaltyRewardNotFoundError, RewardNotAvailableError,
  InsufficientPointsError, LoyaltyValidationError,
} from '../../domain/errors/LoyaltyErrors';

describe('RedeemPointsUseCase', () => {
  let useCase: RedeemPointsUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockRewardRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findMemberByCustomerId: jest.fn().mockResolvedValue({ memberId: 'm1', availablePoints: 500 }),
      createTransaction: jest.fn().mockResolvedValue(undefined),
      updateMemberPoints: jest.fn().mockResolvedValue(undefined),
    };
    mockRewardRepo = {
      findById: jest.fn().mockResolvedValue({ isActive: true, pointsCost: 100, discountValue: 10, name: '10% Off' }),
    };
    useCase = new RedeemPointsUseCase(mockRepo as never, mockRewardRepo as never);
  });

  it('should redeem points (happy path)', async () => {
    const result = await useCase.execute({ customerId: 'c1', points: 100 });

    expect(result.pointsRedeemed).toBe(100);
    expect(result.newBalance).toBe(400);
  });

  it('should redeem points for reward (happy path)', async () => {
    const result = await useCase.execute({ customerId: 'c1', points: 100, rewardId: 'rwd1' });

    expect(result.discountValue).toBe(10);
  });

  it('should throw LoyaltyMemberNotFoundError when member not found', async () => {
    mockRepo.findMemberByCustomerId.mockResolvedValue(null);

    await expect(useCase.execute({ customerId: 'missing', points: 10 })).rejects.toThrow(LoyaltyMemberNotFoundError);
  });

  it('should throw InsufficientPointsError when not enough points', async () => {
    await expect(useCase.execute({ customerId: 'c1', points: 600 })).rejects.toThrow(InsufficientPointsError);
  });

  it('should throw LoyaltyRewardNotFoundError when reward not found', async () => {
    mockRewardRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ customerId: 'c1', points: 100, rewardId: 'missing' })).rejects.toThrow(LoyaltyRewardNotFoundError);
  });

  it('should throw RewardNotAvailableError when reward is inactive', async () => {
    mockRewardRepo.findById.mockResolvedValue({ isActive: false, pointsCost: 100, name: 'Test' });

    await expect(useCase.execute({ customerId: 'c1', points: 100, rewardId: 'rwd1' })).rejects.toThrow(RewardNotAvailableError);
  });

  it('should throw LoyaltyValidationError when reward requires more points', async () => {
    mockRewardRepo.findById.mockResolvedValue({ isActive: true, pointsCost: 200, name: 'Expensive' });

    await expect(useCase.execute({ customerId: 'c1', points: 100, rewardId: 'rwd1' })).rejects.toThrow(LoyaltyValidationError);
  });
});
