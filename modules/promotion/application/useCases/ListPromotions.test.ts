jest.mock('../../infrastructure/repositories/PromotionRuleRepository', () => ({
  __esModule: true,
  default: {
    promotions: {
      findAll: jest.fn().mockResolvedValue([]),
    },
  },
}));

import { ListPromotionsUseCase, ListPromotionsCommand } from './ListPromotions';
import promotionRuleRepository from '../../infrastructure/repositories/PromotionRuleRepository';

describe('ListPromotionsUseCase', () => {
  let useCase: ListPromotionsUseCase;
  const mockPromotions = promotionRuleRepository.promotions;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPromotions.findAll = jest.fn().mockResolvedValue([
      { promotionId: 'p1', name: 'Promo 1', status: 'active' },
      { promotionId: 'p2', name: 'Promo 2', status: 'scheduled' },
    ]);
    useCase = new ListPromotionsUseCase(mockPromotions as never);
  });

  it('should list promotions with default pagination', async () => {
    const result = await useCase.execute(new ListPromotionsCommand());

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(0);
  });

  it('should pass filters and pagination to repository', async () => {
    await useCase.execute(new ListPromotionsCommand({ status: 'active', isActive: true }, { limit: 10, offset: 5 }));

    expect(mockPromotions.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active', isActive: true }),
      expect.objectContaining({ limit: 10, offset: 5 }),
    );
  });

  it('should set hasMore=true when results equal limit', async () => {
    mockPromotions.findAll = jest.fn().mockResolvedValue(Array.from({ length: 10 }, (_, i) => ({ promotionId: `p${i}` })));

    const result = await useCase.execute(new ListPromotionsCommand({}, { limit: 10 }));

    expect(result.hasMore).toBe(true);
  });
});
