jest.mock('../../infrastructure/repositories/PromotionRuleRepository', () => ({
  __esModule: true,
  default: {
    promotions: {
      findById: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    },
  },
}));

import { CreatePromotionUseCase, CreatePromotionCommand } from './CreatePromotion';
import { PromotionCodeAlreadyExistsError, PromotionValidationError } from '../../domain/errors/PromotionErrors';
import promotionRuleRepository from '../../infrastructure/repositories/PromotionRuleRepository';

describe('CreatePromotionUseCase', () => {
  let useCase: CreatePromotionUseCase;
  const mockPromotions = promotionRuleRepository.promotions;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPromotions.create = jest.fn().mockResolvedValue({
      promotionId: 'promo-1', code: 'SAVE10', name: 'Save 10%', status: 'active', createdAt: new Date(),
    });
    useCase = new CreatePromotionUseCase(mockPromotions as never);
  });

  it('should create a promotion (happy path)', async () => {
    const result = await useCase.execute(new CreatePromotionCommand('Save 10%', 'percentage', 10, 'SAVE10'));

    expect(result.promotionId).toBe('promo-1');
    expect(result.name).toBe('Save 10%');
  });

  it('should throw PromotionValidationError when name is empty', async () => {
    await expect(useCase.execute(new CreatePromotionCommand('', 'percentage', 10))).rejects.toThrow(PromotionValidationError);
  });

  it('should throw PromotionValidationError when value is negative', async () => {
    await expect(useCase.execute(new CreatePromotionCommand('Test', 'fixed_amount', -5))).rejects.toThrow(PromotionValidationError);
  });

  it('should throw PromotionCodeAlreadyExistsError when code already exists', async () => {
    mockPromotions.findById = jest.fn().mockResolvedValue({ promotionId: 'existing' });

    await expect(useCase.execute(new CreatePromotionCommand('Test', 'percentage', 10, 'DUP'))).rejects.toThrow(PromotionCodeAlreadyExistsError);
  });
});
