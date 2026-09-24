import '../../tests/testUtils';
import { ApplyPromotionUseCase, ApplyPromotionCommand } from './ApplyPromotion';
import { createPromotionRepository, createPromotion } from '../../tests/testUtils';

describe('ApplyPromotionUseCase', () => {
  const promotionRepository = createPromotionRepository();
  const useCase = new ApplyPromotionUseCase(promotionRepository);
  const validateCodeMock = promotionRepository.validateCode as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    validateCodeMock.mockResolvedValue({
      valid: true,
      promotion: { ...createPromotion(), code: 'SUMMER', type: 'percentage' },
      discount: 15,
    });
  });

  it('should apply the promotion when the code validates', async () => {
    const result = await useCase.execute(new ApplyPromotionCommand('summer', 100, 'cust-1'));

    expect(result.valid).toBe(true);
    expect(result.promotionId).toBe('promo-1');
    expect(result.code).toBe('SUMMER');
    expect(result.discountAmountCents).toBe(15);
    expect(promotionRepository.validateCode).toHaveBeenCalledWith('SUMMER', 100, 'cust-1');
  });

  it('should return invalid when the code is empty', async () => {
    const result = await useCase.execute(new ApplyPromotionCommand('', 100));

    expect(result.valid).toBe(false);
    expect(result.message).toBe('Promotion code is required');
    expect(promotionRepository.validateCode).not.toHaveBeenCalled();
  });

  it('should propagate the failure message when validation fails', async () => {
    validateCodeMock.mockResolvedValue({ valid: false, message: 'Code expired' });

    const result = await useCase.execute(new ApplyPromotionCommand('SUMMER', 100));

    expect(result.valid).toBe(false);
    expect(result.message).toBe('Code expired');
  });

  it('should fall back to a generic message when validation fails without one', async () => {
    validateCodeMock.mockResolvedValue({ valid: false });

    const result = await useCase.execute(new ApplyPromotionCommand('SUMMER', 100));

    expect(result.valid).toBe(false);
    expect(result.message).toBe('Invalid promotion code');
  });
});
