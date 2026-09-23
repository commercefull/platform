import '../../tests/testUtils';
import { DeletePromotionUseCase, DeletePromotionCommand } from './DeletePromotion';
import { PromotionNotFoundError } from '../../domain/errors/PromotionErrors';
import { createPromotionRepository, createPromotion } from '../../tests/testUtils';

describe('DeletePromotionUseCase', () => {
  const promotionRepository = createPromotionRepository();
  const useCase = new DeletePromotionUseCase(promotionRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    promotionRepository.findById.mockResolvedValue(createPromotion());
    promotionRepository.delete.mockResolvedValue(true);
  });

  it('should delete the promotion when it exists', async () => {
    const result = await useCase.execute(new DeletePromotionCommand('promo-1'));

    expect(result).toEqual({ promotionId: 'promo-1', deleted: true });
    expect(promotionRepository.delete).toHaveBeenCalledWith('promo-1');
  });

  it('should throw PromotionNotFoundError when the promotion does not exist', async () => {
    promotionRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(new DeletePromotionCommand('missing'))).rejects.toThrow(PromotionNotFoundError);
    expect(promotionRepository.delete).not.toHaveBeenCalled();
  });

  it('should report deleted=false when the repository does not delete', async () => {
    promotionRepository.delete.mockResolvedValue(false);

    const result = await useCase.execute(new DeletePromotionCommand('promo-1'));

    expect(result.deleted).toBe(false);
  });
});
