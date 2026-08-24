import { CreateRewardUseCase} from './CreateReward';
import { LoyaltyValidationError } from '../../domain/errors/LoyaltyErrors';

describe('CreateRewardUseCase', () => {
  let useCase: CreateRewardUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      createReward: jest.fn().mockResolvedValue({
        rewardId: 'rwd1', name: '10% Off', pointsCost: 100, type: 'discount', isActive: true, createdAt: new Date(),
      }),
    };
    useCase = new CreateRewardUseCase(mockRepo as never);
  });

  it('should create reward (happy path)', async () => {
    const result = await useCase.execute({ name: '10% Off', description: '10% discount', type: 'discount', pointsCost: 100, value: 10, valueType: 'percentage' });

    expect(result.rewardId).toBe('rwd1');
    expect(result.pointsCost).toBe(100);
  });

  it('should throw LoyaltyValidationError when pointsCost <= 0', async () => {
    await expect(useCase.execute({ name: 'Test', description: 'test', type: 'free_product', pointsCost: 0 })).rejects.toThrow(LoyaltyValidationError);
  });

  it('should throw LoyaltyValidationError when discount type missing value', async () => {
    await expect(useCase.execute({ name: 'Test', description: 'test', type: 'discount', pointsCost: 50 })).rejects.toThrow(LoyaltyValidationError);
  });
});
