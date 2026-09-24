import { createCheckoutRepository, createCheckoutSession, emitMock } from '../../tests/testUtils';
import { RemoveCouponUseCase, RemoveCouponCommand } from './RemoveCoupon';
import { NotFoundError } from '../../../../libs/errors';
import { Money } from '../../../../libs/money';

describe('RemoveCouponUseCase', () => {
  let useCase: RemoveCouponUseCase;
  let checkoutRepository: ReturnType<typeof createCheckoutRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    checkoutRepository = createCheckoutRepository();
    useCase = new RemoveCouponUseCase(checkoutRepository);
  });

  it('should remove the coupon, persist the session, and emit checkout.updated when the session exists', async () => {
    const session = createCheckoutSession({ couponCode: 'SAVE10', discountAmount: Money.create(10, 'USD') });
    checkoutRepository.findById.mockResolvedValue(session);

    const result = await useCase.execute(new RemoveCouponCommand('ck-1'));

    expect(result.couponCode).toBeUndefined();
    expect(session.couponCode).toBeUndefined();
    expect(session.discountAmount.cents).toBe(0);
    expect(checkoutRepository.save).toHaveBeenCalledWith(session);
    expect(emitMock).toHaveBeenCalledWith('checkout.updated', expect.objectContaining({ checkoutId: 'ck-1', field: 'coupon', couponCode: null, previousCoupon: 'SAVE10' }));
  });

  it('should throw NotFoundError when the session does not exist', async () => {
    checkoutRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(new RemoveCouponCommand('missing'))).rejects.toThrow(NotFoundError);
    expect(checkoutRepository.save).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
