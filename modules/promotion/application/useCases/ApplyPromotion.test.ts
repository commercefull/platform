import { ApplyPromotionUseCase, ApplyPromotionCommand } from './ApplyPromotion';

const mockPromotionRepository = {
  validateCode: jest.fn().mockResolvedValue({
    valid: true,
    promotion: { promotionId: 'p1', code: 'SAVE10', type: 'percentage' },
    discount: 10,
  }),
};

describe('ApplyPromotionUseCase', () => {
  let useCase: ApplyPromotionUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ApplyPromotionUseCase(mockPromotionRepository as never);
  });

  it('should apply promotion (happy path)', async () => {
    const result = await useCase.execute(new ApplyPromotionCommand('SAVE10', 100));

    expect(result.valid).toBe(true);
    expect(result.promotionId).toBe('p1');
    expect(result.discountAmount).toBe(10);
  });

  it('should return invalid when code is empty', async () => {
    const result = await useCase.execute(new ApplyPromotionCommand('', 100));

    expect(result.valid).toBe(false);
    expect(result.message).toContain('required');
  });

  it('should return invalid when promotion validation fails', async () => {
    mockPromotionRepository.validateCode.mockResolvedValueOnce({
      valid: false, message: 'Expired',
    });

    const result = await useCase.execute(new ApplyPromotionCommand('EXPIRED', 100));

    expect(result.valid).toBe(false);
    expect(result.message).toBe('Expired');
  });
});
