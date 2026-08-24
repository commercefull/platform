jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { SetShippingAddressUseCase, SetShippingAddressCommand } from './SetShippingAddress';
import { NotFoundError, BadRequestError } from '../../../../libs/errors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('SetShippingAddressUseCase', () => {
  let useCase: SetShippingAddressUseCase;
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
      setShippingAddress: jest.fn(),
      updateAmounts: jest.fn(),
    };
    mockRepo = {
      findById: jest.fn().mockResolvedValue(mockSession),
      validateShippingAddress: jest.fn().mockResolvedValue({ valid: true, errors: [] }),
      calculateTax: jest.fn().mockResolvedValue(0),
      save: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new SetShippingAddressUseCase(mockRepo as never);
  });

  it('should set shipping address (happy path)', async () => {
    const result = await useCase.execute(new SetShippingAddressCommand(
      'ck-1', 'John', 'Doe', '123 Main St', 'NYC', '10001', 'US',
    ));

    expect(result.checkoutId).toBe('ck-1');
    expect(mockSession.setShippingAddress).toHaveBeenCalled();
    expect(eventBus.emit).toHaveBeenCalledWith('checkout.updated', expect.objectContaining({ checkoutId: 'ck-1' }));
  });

  it('should throw NotFoundError when session not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new SetShippingAddressCommand(
      'missing', 'John', 'Doe', '123 Main St', 'NYC', '10001', 'US',
    ))).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError when address validation fails', async () => {
    mockRepo.validateShippingAddress.mockResolvedValue({ valid: false, errors: ['Invalid postal code'] });

    await expect(useCase.execute(new SetShippingAddressCommand(
      'ck-1', 'John', 'Doe', '123 Main St', 'NYC', 'bad', 'US',
    ))).rejects.toThrow(BadRequestError);
  });
});
