jest.mock('../../infrastructure/repositories/PromotionRuleRepository', () => ({
  __esModule: true,
  default: {
    promotions: {
      findById: jest.fn().mockResolvedValue(null),
      delete: jest.fn(),
    },
  },
}));

import { DeletePromotionUseCase, DeletePromotionCommand } from './DeletePromotion';
import { PromotionNotFoundError } from '../../domain/errors/PromotionErrors';
import promotionRuleRepository from '../../infrastructure/repositories/PromotionRuleRepository';

describe('DeletePromotionUseCase', () => {
  let useCase: DeletePromotionUseCase;
  const mockPromotions = promotionRuleRepository.promotions;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPromotions.findById = jest.fn().mockResolvedValue({ promotionId: 'p1' });
    mockPromotions.delete = jest.fn().mockResolvedValue(true);
    useCase = new DeletePromotionUseCase(mockPromotions as never);
  });

  it('should delete promotion (happy path)', async () => {
    const result = await useCase.execute(new DeletePromotionCommand('p1'));

    expect(result.promotionId).toBe('p1');
    expect(result.deleted).toBe(true);
  });

  it('should throw PromotionNotFoundError when promotion does not exist', async () => {
    mockPromotions.findById = jest.fn().mockResolvedValue(null);

    await expect(useCase.execute(new DeletePromotionCommand('missing'))).rejects.toThrow(PromotionNotFoundError);
  });
});
