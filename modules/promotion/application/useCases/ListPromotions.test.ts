import '../../tests/testUtils';
import { ListPromotionsUseCase, ListPromotionsCommand } from './ListPromotions';
import { createPromotionRepository, createPromotion } from '../../tests/testUtils';

describe('ListPromotionsUseCase', () => {
  const promotionRepository = createPromotionRepository();
  const useCase = new ListPromotionsUseCase(promotionRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    promotionRepository.findAll.mockResolvedValue([createPromotion()]);
  });

  it('should list promotions with default pagination', async () => {
    const result = await useCase.execute(new ListPromotionsCommand());

    expect(result.data).toHaveLength(1);
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(0);
    expect(result.hasMore).toBe(false);
    expect(promotionRepository.findAll).toHaveBeenCalledWith(
      { status: undefined, isActive: undefined, organizationId: undefined },
      { limit: 50, offset: 0, orderBy: 'createdAt', direction: 'DESC' },
    );
  });

  it('should forward filters and pagination to the repository', async () => {
    await useCase.execute(
      new ListPromotionsCommand({ status: 'active', organizationId: 'org-1' }, { limit: 10, offset: 20, orderBy: 'name', direction: 'ASC' }),
    );

    expect(promotionRepository.findAll).toHaveBeenCalledWith(
      { status: 'active', isActive: undefined, organizationId: 'org-1' },
      { limit: 10, offset: 20, orderBy: 'name', direction: 'ASC' },
    );
  });

  it('should report hasMore when the result count equals the limit', async () => {
    promotionRepository.findAll.mockResolvedValue([createPromotion(), createPromotion({ promotionId: 'promo-2' })]);

    const result = await useCase.execute(new ListPromotionsCommand(undefined, { limit: 2 }));

    expect(result.hasMore).toBe(true);
  });
});
