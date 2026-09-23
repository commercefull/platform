import '../../tests/testUtils';
import { CreateRewardUseCase } from './CreateReward';
import { LoyaltyValidationError } from '../../domain/errors/LoyaltyErrors';
import { createRewardRepository } from '../../tests/testUtils';

describe('CreateRewardUseCase', () => {
  const loyaltyRepository = createRewardRepository();
  const useCase = new CreateRewardUseCase(loyaltyRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    loyaltyRepository.createReward.mockResolvedValue({
      rewardId: 'rwd1',
      name: '10% Off',
      pointsCost: 100,
      type: 'discount',
      isActive: true,
      createdAt: new Date(),
    });
  });

  it('should persist the reward when the input is valid', async () => {
    const result = await useCase.execute({
      name: '10% Off',
      description: '10% discount',
      type: 'discount',
      pointsCost: 100,
      value: 10,
      valueType: 'percentage',
    });

    expect(result.rewardId).toBe('rwd1');
    expect(result.pointsCost).toBe(100);
    expect(loyaltyRepository.createReward).toHaveBeenCalledWith(
      expect.objectContaining({ name: '10% Off', type: 'discount', pointsCost: 100 }),
    );
  });

  it('should throw LoyaltyValidationError when the points cost is not positive', async () => {
    await expect(
      useCase.execute({ name: 'Test', description: 'test', type: 'free_product', pointsCost: 0 }),
    ).rejects.toThrow(LoyaltyValidationError);
    expect(loyaltyRepository.createReward).not.toHaveBeenCalled();
  });

  it('should throw LoyaltyValidationError when a discount reward has no value', async () => {
    await expect(
      useCase.execute({ name: 'Test', description: 'test', type: 'discount', pointsCost: 50 }),
    ).rejects.toThrow(LoyaltyValidationError);
    expect(loyaltyRepository.createReward).not.toHaveBeenCalled();
  });
});
