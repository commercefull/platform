import '../../tests/testUtils';
import { CreatePromotionUseCase, CreatePromotionCommand } from './CreatePromotion';
import { PromotionCodeAlreadyExistsError, PromotionValidationError } from '../../domain/errors/PromotionErrors';
import { createPromotionRepository, createPromotion } from '../../tests/testUtils';

describe('CreatePromotionUseCase', () => {
  const promotionRepository = createPromotionRepository();
  const useCase = new CreatePromotionUseCase(promotionRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    promotionRepository.findById.mockResolvedValue(null);
    promotionRepository.create.mockResolvedValue(createPromotion());
  });

  it('should create an active promotion with a percentage action', async () => {
    const result = await useCase.execute(new CreatePromotionCommand('Summer Sale', 'percentage', 10));

    expect(result.promotionId).toBe('promo-1');
    expect(result.status).toBe('active');
    expect(promotionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Summer Sale',
        status: 'active',
        scope: 'cart',
        actions: [{ type: 'discountByPercentage', value: 10 }],
      }),
    );
  });

  it('should create a scheduled promotion when the start date is in the future', async () => {
    promotionRepository.create.mockResolvedValue(createPromotion({ status: 'scheduled' }));

    await useCase.execute(new CreatePromotionCommand('Future Sale', 'fixed_amount', 20, undefined, undefined, undefined, undefined, undefined, undefined, new Date('2999-01-01')));

    expect(promotionRepository.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'scheduled' }));
  });

  it('should map fixed_amount to discountByAmount and free_shipping to discountShipping', async () => {
    await useCase.execute(new CreatePromotionCommand('Fixed', 'fixed_amount', 5));
    expect(promotionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ actions: [{ type: 'discountByAmount', value: 5 }] }),
    );

    await useCase.execute(new CreatePromotionCommand('Shipping', 'free_shipping', 0));
    expect(promotionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ actions: [{ type: 'discountShipping', value: 0 }] }),
    );
  });

  it('should throw PromotionValidationError when the name is empty', async () => {
    await expect(useCase.execute(new CreatePromotionCommand('', 'percentage', 10))).rejects.toThrow(
      PromotionValidationError,
    );
    expect(promotionRepository.create).not.toHaveBeenCalled();
  });

  it('should throw PromotionValidationError when the value is negative', async () => {
    await expect(useCase.execute(new CreatePromotionCommand('Sale', 'percentage', -10))).rejects.toThrow(
      PromotionValidationError,
    );
    expect(promotionRepository.create).not.toHaveBeenCalled();
  });

  it('should throw PromotionCodeAlreadyExistsError when the code is taken', async () => {
    promotionRepository.findById.mockResolvedValue(createPromotion());

    await expect(useCase.execute(new CreatePromotionCommand('Sale', 'percentage', 10, 'EXISTING'))).rejects.toThrow(
      PromotionCodeAlreadyExistsError,
    );
    expect(promotionRepository.create).not.toHaveBeenCalled();
  });

  it('should skip the duplicate check when no code is provided', async () => {
    await useCase.execute(new CreatePromotionCommand('Sale', 'percentage', 10));

    expect(promotionRepository.findById).not.toHaveBeenCalled();
  });
});
