jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { SetBillingAddressUseCase, SetBillingAddressCommand } from './SetBillingAddress';
import { CheckoutSessionNotFoundError } from '../../domain/errors/CheckoutErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('SetBillingAddressUseCase', () => {
  let useCase: SetBillingAddressUseCase;
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
      setBillingAddress: jest.fn(),
    };
    mockRepo = {
      findById: jest.fn().mockResolvedValue(mockSession),
      save: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new SetBillingAddressUseCase(mockRepo as never);
  });

  it('should set billing address (happy path)', async () => {
    const result = await useCase.execute(new SetBillingAddressCommand(
      'ck-1', 'John', 'Doe', '123 Main St', 'Portland', '97201', 'US',
    ));

    expect(result.checkoutId).toBe('ck-1');
    expect(mockSession.setBillingAddress).toHaveBeenCalled();
    expect(eventBus.emit).toHaveBeenCalledWith('checkout.updated', expect.objectContaining({ field: 'billingAddress' }));
  });

  it('should throw CheckoutSessionNotFoundError when session does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new SetBillingAddressCommand(
      'missing', 'John', 'Doe', '123 St', 'City', '12345', 'US',
    ))).rejects.toThrow(CheckoutSessionNotFoundError);
  });
});
