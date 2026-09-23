import { createCheckoutRepository, createCheckoutSession, createDiscountQuotePort, emitMock } from '../../tests/testUtils';
import { ApplyCouponUseCase, ApplyCouponCommand } from './ApplyCoupon';
import { NotFoundError, BadRequestError } from '../../../../libs/errors';

describe('ApplyCouponUseCase', () => {
  let useCase: ApplyCouponUseCase;
  let checkoutRepository: ReturnType<typeof createCheckoutRepository>;
  let discountQuotePort: ReturnType<typeof createDiscountQuotePort>;

  beforeEach(() => {
    jest.clearAllMocks();
    checkoutRepository = createCheckoutRepository();
    discountQuotePort = createDiscountQuotePort();
    useCase = new ApplyCouponUseCase(checkoutRepository, discountQuotePort);
  });

  it('should apply the coupon, persist the session, and emit checkout.updated when the code is valid', async () => {
    const session = createCheckoutSession();
    checkoutRepository.findById.mockResolvedValue(session);
    discountQuotePort.validateDiscount.mockResolvedValue({
      valid: true,
      discount: { code: 'SAVE10', discountAmount: 10 },
    });

    const result = await useCase.execute(new ApplyCouponCommand('ck-1', 'SAVE10'));

    expect(result.couponCode).toBe('SAVE10');
    expect(result.discountAmount).toBe(10);
    expect(discountQuotePort.validateDiscount).toHaveBeenCalledWith('SAVE10', 100, 'USD');
    expect(checkoutRepository.save).toHaveBeenCalledWith(session);
    expect(emitMock).toHaveBeenCalledWith('checkout.updated', expect.objectContaining({ checkoutId: 'ck-1', field: 'coupon', couponCode: 'SAVE10' }));
  });

  it('should throw NotFoundError when the session does not exist', async () => {
    checkoutRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(new ApplyCouponCommand('missing', 'SAVE10'))).rejects.toThrow(NotFoundError);
    expect(discountQuotePort.validateDiscount).not.toHaveBeenCalled();
  });

  it('should throw BadRequestError when no discount service is configured', async () => {
    checkoutRepository.findById.mockResolvedValue(createCheckoutSession());
    useCase = new ApplyCouponUseCase(checkoutRepository);

    await expect(useCase.execute(new ApplyCouponCommand('ck-1', 'SAVE10'))).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when the coupon is invalid', async () => {
    checkoutRepository.findById.mockResolvedValue(createCheckoutSession());
    discountQuotePort.validateDiscount.mockResolvedValue({ valid: false, error: 'Coupon expired' });

    await expect(useCase.execute(new ApplyCouponCommand('ck-1', 'EXPIRED'))).rejects.toThrow(BadRequestError);
    expect(checkoutRepository.save).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
