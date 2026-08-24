jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { SetShippingMethodUseCase, SetShippingMethodCommand } from './SetShippingMethod';
import { NotFoundError, BadRequestError } from '../../../../libs/errors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('SetShippingMethodUseCase', () => {
  let useCase: SetShippingMethodUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockShippingPort: Record<string, jest.Mock>;
  let mockSession: Record<string, unknown>;

  beforeEach(() => {
    mockSession = {
      id: 'ck-1', basketId: 'b1', customerId: 'c1', guestEmail: undefined,
      status: 'pending', paymentStatus: 'pending',
      shippingAddress: { country: 'US', region: 'OR', city: 'Portland', postalCode: '97201', firstName: 'J', lastName: 'D', addressLine1: '123 St' },
      billingAddress: null, shippingMethodId: undefined, shippingMethodName: undefined,
      paymentMethodId: undefined, subtotal: { amount: 100, currency: 'USD' },
      taxAmount: { amount: 0, currency: 'USD' }, shippingAmount: { amount: 0, currency: 'USD' },
      discountAmount: { amount: 0, currency: 'USD' }, total: { amount: 100, currency: 'USD' },
      couponCode: undefined, fulfillmentType: 'shipping', notes: undefined, sameAsShipping: false,
      createdAt: new Date(), updatedAt: new Date(), expiresAt: new Date(),
      setShippingMethod: jest.fn(),
    };
    mockRepo = {
      findById: jest.fn().mockResolvedValue(mockSession),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockShippingPort = {
      getShippingOptions: jest.fn().mockResolvedValue([
        { methodId: 'sm-1', methodName: 'Standard', amount: 9.99, currency: 'USD' },
        { methodId: 'sm-2', methodName: 'Express', amount: 19.99, currency: 'USD' },
      ]),
    };
    useCase = new SetShippingMethodUseCase(mockRepo as never, mockShippingPort as never);
  });

  it('should set shipping method (happy path)', async () => {
    const result = await useCase.execute(new SetShippingMethodCommand('ck-1', 'sm-1'));

    expect(result.checkoutId).toBe('ck-1');
    expect(mockSession.setShippingMethod).toHaveBeenCalled();
    expect(eventBus.emit).toHaveBeenCalledWith('checkout.updated', expect.objectContaining({ field: 'shippingMethod' }));
  });

  it('should throw NotFoundError when session does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new SetShippingMethodCommand('missing', 'sm-1'))).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError when shipping address not set', async () => {
    mockSession.shippingAddress = null;

    await expect(useCase.execute(new SetShippingMethodCommand('ck-1', 'sm-1'))).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when shipping service unavailable', async () => {
    useCase = new SetShippingMethodUseCase(mockRepo as never);

    await expect(useCase.execute(new SetShippingMethodCommand('ck-1', 'sm-1'))).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError for invalid shipping method', async () => {
    await expect(useCase.execute(new SetShippingMethodCommand('ck-1', 'invalid'))).rejects.toThrow(BadRequestError);
  });
});
