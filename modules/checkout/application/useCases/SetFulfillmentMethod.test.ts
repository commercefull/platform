jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { SetFulfillmentMethodUseCase, SetFulfillmentMethodCommand } from './SetFulfillmentMethod';
import { CheckoutSessionNotFoundError, CheckoutValidationError } from '../../domain/errors/CheckoutErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('SetFulfillmentMethodUseCase', () => {
  let useCase: SetFulfillmentMethodUseCase;
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
      setFulfillmentType: jest.fn(),
    };
    mockRepo = {
      findById: jest.fn().mockResolvedValue(mockSession),
      save: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new SetFulfillmentMethodUseCase(mockRepo as never);
  });

  it('should set fulfillment type to shipping (happy path)', async () => {
    const result = await useCase.execute(new SetFulfillmentMethodCommand('ck-1', 'shipping'));

    expect(result.checkoutId).toBe('ck-1');
    expect(mockSession.setFulfillmentType).toHaveBeenCalledWith('shipping');
    expect(eventBus.emit).toHaveBeenCalledWith('checkout.updated', expect.objectContaining({ fulfillmentType: 'shipping' }));
  });

  it('should set fulfillment type to pickup', async () => {
    await useCase.execute(new SetFulfillmentMethodCommand('ck-1', 'pickup'));

    expect(mockSession.setFulfillmentType).toHaveBeenCalledWith('pickup');
  });

  it('should throw CheckoutSessionNotFoundError when session does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new SetFulfillmentMethodCommand('missing', 'shipping'))).rejects.toThrow(CheckoutSessionNotFoundError);
  });

  it('should throw CheckoutValidationError for invalid fulfillment type', async () => {
    await expect(useCase.execute(new SetFulfillmentMethodCommand('ck-1', 'invalid' as never))).rejects.toThrow(CheckoutValidationError);
  });
});
