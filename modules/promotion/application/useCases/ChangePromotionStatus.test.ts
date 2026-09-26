import { ChangePromotionStatusUseCase } from './ChangePromotionStatus';
import { PromotionNotFoundError } from '../../domain/errors/PromotionErrors';
import { lazyMock, createPromotion } from '../../tests/testUtils';
import type { ChangePromotionStatusPort } from './ChangePromotionStatus';

describe('ChangePromotionStatusUseCase', () => {
  it('should activate an existing promotion', async () => {
    const promotions = lazyMock<ChangePromotionStatusPort>();
    const promotion = createPromotion();
    promotions.findById.mockResolvedValue(promotion);
    promotions.update.mockResolvedValue({ ...promotion, status: 'active' });
    const useCase = new ChangePromotionStatusUseCase(promotions);

    const result = await useCase.activate(promotion.promotionId);

    expect(promotions.findById).toHaveBeenCalledWith(promotion.promotionId);
    expect(promotions.update).toHaveBeenCalledWith(promotion.promotionId, { status: 'active' });
    expect(result.status).toBe('active');
  });

  it('should pause an existing promotion', async () => {
    const promotions = lazyMock<ChangePromotionStatusPort>();
    const promotion = createPromotion({ status: 'active' });
    promotions.findById.mockResolvedValue(promotion);
    promotions.update.mockImplementation(async (_id, input) => ({ ...promotion, status: input.status ?? 'active' }));
    const useCase = new ChangePromotionStatusUseCase(promotions);

    const result = await useCase.pause(promotion.promotionId);

    expect(promotions.update).toHaveBeenCalledWith(promotion.promotionId, { status: 'paused' });
    expect(result.status).toBe('paused');
  });

  it('should throw PromotionNotFoundError when the promotion does not exist', async () => {
    const promotions = lazyMock<ChangePromotionStatusPort>();
    promotions.findById.mockResolvedValue(null);
    const useCase = new ChangePromotionStatusUseCase(promotions);

    await expect(useCase.activate('missing')).rejects.toBeInstanceOf(PromotionNotFoundError);
    await expect(useCase.pause('missing')).rejects.toBeInstanceOf(PromotionNotFoundError);
    expect(promotions.update).not.toHaveBeenCalled();
  });
});
