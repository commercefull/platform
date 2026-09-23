import '../../tests/testUtils';
import { UpdatePromotionUseCase, UpdatePromotionCommand } from './UpdatePromotion';
import { PromotionNotFoundError, PromotionValidationError } from '../../domain/errors/PromotionErrors';
import { createPromotionRepository, createPromotion } from '../../tests/testUtils';

describe('UpdatePromotionUseCase', () => {
  const promotionRepository = createPromotionRepository();
  const useCase = new UpdatePromotionUseCase(promotionRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    promotionRepository.findById.mockResolvedValue(createPromotion());
    promotionRepository.update.mockResolvedValue(createPromotion({ name: 'New Name' }));
  });

  it('should update the promotion fields that were provided', async () => {
    const result = await useCase.execute(new UpdatePromotionCommand('promo-1', { name: 'New Name' }));

    expect(result.name).toBe('New Name');
    expect(promotionRepository.update).toHaveBeenCalledWith('promo-1', { name: 'New Name' });
  });

  it('should map usageLimit to maxUsage and startsAt to startDate', async () => {
    const startsAt = new Date('2025-01-01');
    await useCase.execute(new UpdatePromotionCommand('promo-1', { usageLimit: 100, startsAt, isActive: false }));

    expect(promotionRepository.update).toHaveBeenCalledWith('promo-1', {
      maxUsage: 100,
      startDate: startsAt,
      isActive: false,
    });
  });

  it('should throw PromotionNotFoundError when the promotion does not exist', async () => {
    promotionRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(new UpdatePromotionCommand('missing', { name: 'X' }))).rejects.toThrow(
      PromotionNotFoundError,
    );
    expect(promotionRepository.update).not.toHaveBeenCalled();
  });

  it('should throw PromotionValidationError when the value is negative', async () => {
    await expect(useCase.execute(new UpdatePromotionCommand('promo-1', { value: -5 }))).rejects.toThrow(
      PromotionValidationError,
    );
    expect(promotionRepository.update).not.toHaveBeenCalled();
  });
});
