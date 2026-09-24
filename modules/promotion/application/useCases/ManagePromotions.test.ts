import '../../tests/testUtils';
import { ManagePromotionsUseCase } from './ManagePromotions';
import {
  createPromotionRepository,
  createPromotion,
} from '../../tests/testUtils';

describe('ManagePromotionsUseCase', () => {
  const promotionRepository = createPromotionRepository();
  const useCase = new ManagePromotionsUseCase(promotionRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the promotion for the given id', async () => {
    promotionRepository.findById.mockResolvedValue(createPromotion());

    const result = await useCase.findById('promo-1');

    expect(result?.promotionId).toBe('promo-1');
    expect(promotionRepository.findById).toHaveBeenCalledWith('promo-1');
  });

  it('should forward filters and pagination to findAll', async () => {
    promotionRepository.findAll.mockResolvedValue([]);

    const result = await useCase.findAll({ status: 'active' }, { limit: 10 });

    expect(result).toEqual([]);
    expect(promotionRepository.findAll).toHaveBeenCalledWith({ status: 'active' }, { limit: 10 });
  });

  it('should forward scope and organization to findActive', async () => {
    promotionRepository.findActive.mockResolvedValue([createPromotion()]);

    const result = await useCase.findActive('cart', 'org-1');

    expect(result).toHaveLength(1);
    expect(promotionRepository.findActive).toHaveBeenCalledWith('cart', 'org-1');
  });

  it('should delegate creation to the repository', async () => {
    promotionRepository.create.mockResolvedValue(createPromotion());
    const input = { name: 'Sale', scope: 'cart' as const };

    const result = await useCase.create(input);

    expect(result.promotionId).toBe('promo-1');
    expect(promotionRepository.create).toHaveBeenCalledWith(input);
  });

  it('should delegate deletion to the repository', async () => {
    promotionRepository.delete.mockResolvedValue(true);

    const result = await useCase.delete('promo-1');

    expect(result).toBe(true);
    expect(promotionRepository.delete).toHaveBeenCalledWith('promo-1');
  });
});

