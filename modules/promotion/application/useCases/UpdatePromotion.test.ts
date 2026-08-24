jest.mock('../../infrastructure/repositories/PromotionRuleRepository', () => ({
  __esModule: true,
  default: {
    promotions: {
      findById: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    },
  },
}));

import { UpdatePromotionUseCase, UpdatePromotionCommand } from './UpdatePromotion';
import { PromotionNotFoundError, PromotionValidationError } from '../../domain/errors/PromotionErrors';
import promotionRuleRepository from '../../infrastructure/repositories/PromotionRuleRepository';

describe('UpdatePromotionUseCase', () => {
  let useCase: UpdatePromotionUseCase;
  const mockPromotions = promotionRuleRepository.promotions;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPromotions.findById = jest.fn().mockResolvedValue({ promotionId: 'p1', name: 'Old', status: 'active', updatedAt: new Date() });
    mockPromotions.update = jest.fn().mockResolvedValue({ promotionId: 'p1', name: 'New', status: 'active', updatedAt: new Date() });
    useCase = new UpdatePromotionUseCase(mockPromotions as never);
  });

  it('should update promotion name (happy path)', async () => {
    const result = await useCase.execute(new UpdatePromotionCommand('p1', { name: 'New Name' }));

    expect(result.promotionId).toBe('p1');
    expect(mockPromotions.update).toHaveBeenCalled();
  });

  it('should throw PromotionNotFoundError when promotion does not exist', async () => {
    mockPromotions.findById = jest.fn().mockResolvedValue(null);

    await expect(useCase.execute(new UpdatePromotionCommand('missing', { name: 'X' }))).rejects.toThrow(PromotionNotFoundError);
  });

  it('should throw PromotionValidationError when value is negative', async () => {
    await expect(useCase.execute(new UpdatePromotionCommand('p1', { value: -5 }))).rejects.toThrow(PromotionValidationError);
  });
});
