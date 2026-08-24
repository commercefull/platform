jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { SetPaymentMethodUseCase, SetPaymentMethodCommand } from './SetPaymentMethod';
import { NotFoundError, BadRequestError } from '../../../../libs/errors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('SetPaymentMethodUseCase', () => {
  let useCase: SetPaymentMethodUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockSession: Record<string, unknown>;

  beforeEach(() => {
    mockSession = {
      id: 'ck-1', basketId: 'b1', customerId: 'c1', guestEmail: undefined,
      status: 'pending', paymentStatus: 'pending', shippingAddress: null,
      billingAddress: null, shippingMethodId: undefined, shippingMethodName: undefined,
      paymentMethodId: undefined, subtotal: { amount: 100, currency: 'USD' },
      taxAmount: { amount: 0, currency: 'USD' }, shippingAmount: { amount: 0, currency: 'USD' },
      discountAmount: { amount: 0, currency: 'USD' }, total: { amount: 100, currency: 'USD' },
      couponCode: undefined, fulfillmentType: 'shipping', notes: undefined, sameAsShipping: false,
      createdAt: new Date(), updatedAt: new Date(), expiresAt: new Date(),
      setPaymentMethod: jest.fn(),
    };
    mockRepo = {
      findById: jest.fn().mockResolvedValue(mockSession),
      save: jest.fn().mockResolvedValue(undefined),
      getAvailablePaymentMethods: jest.fn().mockResolvedValue([
        { id: 'pm-1', name: 'Credit Card' },
        { id: 'pm-2', name: 'PayPal' },
      ]),
    };
    useCase = new SetPaymentMethodUseCase(mockRepo as never);
  });

  it('should set payment method (happy path)', async () => {
    const result = await useCase.execute(new SetPaymentMethodCommand('ck-1', 'pm-1'));

    expect(result.checkoutId).toBe('ck-1');
    expect(mockSession.setPaymentMethod).toHaveBeenCalledWith('pm-1');
    expect(eventBus.emit).toHaveBeenCalledWith('checkout.updated', expect.objectContaining({ field: 'paymentMethod' }));
  });

  it('should throw NotFoundError when session does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new SetPaymentMethodCommand('missing', 'pm-1'))).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError for invalid payment method', async () => {
    await expect(useCase.execute(new SetPaymentMethodCommand('ck-1', 'invalid'))).rejects.toThrow(BadRequestError);
  });
});
