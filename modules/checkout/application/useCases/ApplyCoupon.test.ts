import {
  createCheckoutRepository,
  createCheckoutSession,
  createDiscountQuotePort,
  createBasketSnapshot,
  emitMock,
} from '../../tests/testUtils';
import { ApplyCouponUseCase, ApplyCouponCommand } from './ApplyCoupon';
import { NotFoundError, BadRequestError } from '../../../../libs/errors';
import { Money } from '../../../../libs/money';
import type { BasketSnapshotPort } from '../../application/ports/BasketSnapshotPort';

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
      discount: { code: 'SAVE10', discountAmountCents: 1000 },
    });

    const result = await useCase.execute(new ApplyCouponCommand('ck-1', 'SAVE10'));

    expect(result.couponCode).toBe('SAVE10');
    expect(result.discountAmountCents).toBe(1000);
    expect(discountQuotePort.validateDiscount).toHaveBeenCalledWith('SAVE10', 10000, 'USD', expect.objectContaining({}));
    expect(checkoutRepository.save).toHaveBeenCalledWith(session);
    expect(emitMock).toHaveBeenCalledWith(
      'checkout.updated',
      expect.objectContaining({ checkoutId: 'ck-1', field: 'coupon', couponCode: 'SAVE10' }),
    );
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

  it('should pass basket store/channel context to discount validation when a snapshot port is configured', async () => {
    const basketSnapshotPort: jest.Mocked<BasketSnapshotPort> = { getSnapshot: jest.fn() };
    basketSnapshotPort.getSnapshot.mockResolvedValue(
      createBasketSnapshot({
        storeId: 'store-uk',
        channelId: 'ch-web',
        items: [
          {
            productId: 'prod-1',
            sku: 'SKU-1',
            name: 'Item',
            quantity: 2,
            unitPrice: Money.create(50, 'GBP'),
            itemType: 'physical',
            isDigital: false,
          },
        ],
      }),
    );
    checkoutRepository.findById.mockResolvedValue(createCheckoutSession({ basketId: 'b-1' }));
    discountQuotePort.validateDiscount.mockResolvedValue({
      valid: true,
      discount: { code: 'UK10', discountAmountCents: 500 },
    });
    useCase = new ApplyCouponUseCase(checkoutRepository, discountQuotePort, basketSnapshotPort);

    await useCase.execute(new ApplyCouponCommand('ck-1', 'UK10'));

    expect(basketSnapshotPort.getSnapshot).toHaveBeenCalledWith('b-1');
    expect(discountQuotePort.validateDiscount).toHaveBeenCalledWith(
      'UK10',
      10000,
      'USD',
      expect.objectContaining({
        storeId: 'store-uk',
        channelId: 'ch-web',
        items: [expect.objectContaining({ productId: 'prod-1', quantity: 2 })],
      }),
    );
  });

  it('should still validate the coupon when the basket snapshot is unavailable', async () => {
    const basketSnapshotPort: jest.Mocked<BasketSnapshotPort> = { getSnapshot: jest.fn() };
    basketSnapshotPort.getSnapshot.mockResolvedValue(null);
    checkoutRepository.findById.mockResolvedValue(createCheckoutSession());
    discountQuotePort.validateDiscount.mockResolvedValue({
      valid: true,
      discount: { code: 'SAVE10', discountAmountCents: 1000 },
    });
    useCase = new ApplyCouponUseCase(checkoutRepository, discountQuotePort, basketSnapshotPort);

    const result = await useCase.execute(new ApplyCouponCommand('ck-1', 'SAVE10'));

    expect(result.couponCode).toBe('SAVE10');
  });
});
