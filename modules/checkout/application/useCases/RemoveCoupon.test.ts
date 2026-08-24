jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { RemoveCouponUseCase, RemoveCouponCommand } from './RemoveCoupon';
import { NotFoundError } from '../../../../libs/errors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('RemoveCouponUseCase', () => {
  let useCase: RemoveCouponUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockSession: Record<string, unknown>;

  beforeEach(() => {
    mockSession = {
      id: 'ck-1', basketId: 'b1', customerId: 'c1', guestEmail: undefined,
      status: 'pending', paymentStatus: 'pending', shippingAddress: null,
      billingAddress: null, shippingMethodId: undefined, shippingMethodName: undefined,
      paymentMethodId: undefined, subtotal: { amount: 100, currency: 'USD' },
      taxAmount: { amount: 0, currency: 'USD' }, shippingAmount: { amount: 0, currency: 'USD' },
      discountAmount: { amount: 10, currency: 'USD' }, total: { amount: 90, currency: 'USD' },
      couponCode: 'SAVE10', fulfillmentType: 'shipping', notes: undefined, sameAsShipping: false,
      createdAt: new Date(), updatedAt: new Date(), expiresAt: new Date(),
      removeCoupon: jest.fn(),
    };
    mockRepo = {
      findById: jest.fn().mockResolvedValue(mockSession),
      save: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new RemoveCouponUseCase(mockRepo as never);
  });

  it('should remove coupon (happy path)', async () => {
    const result = await useCase.execute(new RemoveCouponCommand('ck-1'));

    expect(result.checkoutId).toBe('ck-1');
    expect(mockSession.removeCoupon).toHaveBeenCalled();
    expect(eventBus.emit).toHaveBeenCalledWith('checkout.updated', expect.objectContaining({ checkoutId: 'ck-1', couponCode: null }));
  });

  it('should throw NotFoundError when session not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new RemoveCouponCommand('missing'))).rejects.toThrow(NotFoundError);
  });
});
