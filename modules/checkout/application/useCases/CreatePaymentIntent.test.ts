jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { CreatePaymentIntentUseCase, CreatePaymentIntentCommand } from './CreatePaymentIntent';
import { CheckoutSessionNotFoundError, CheckoutValidationError } from '../../domain/errors/CheckoutErrors';

describe('CreatePaymentIntentUseCase', () => {
  let useCase: CreatePaymentIntentUseCase;
  let mockCheckoutRepo: Record<string, jest.Mock>;
  let mockBasketPort: Record<string, jest.Mock>;
  let mockOrderPort: Record<string, jest.Mock>;
  let mockPaymentPort: Record<string, jest.Mock>;

  beforeEach(() => {
    mockCheckoutRepo = {
      findById: jest.fn().mockResolvedValue({
        id: 'ck-1', basketId: 'b1', customerId: 'c1', guestEmail: 'test@test.com',
        status: 'pending', isReadyForPayment: true, paymentIntentId: null, orderId: null,
        subtotal: { amount: 100, currency: 'USD' }, total: { amount: 100, currency: 'USD' },
        shippingAmount: { amount: 0, currency: 'USD' }, taxAmount: { amount: 0, currency: 'USD' },
        discountAmount: { amount: 0, currency: 'USD' },
        shippingAddress: {}, shippingMethodId: 'sm1', paymentMethodId: 'pm1',
        notes: undefined, metadata: undefined, couponCode: undefined,
        setPaymentIntent: jest.fn(),
      }),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockBasketPort = {
      getSnapshot: jest.fn().mockResolvedValue({ items: [{ productId: 'p1', name: 'Widget', quantity: 2, unitPrice: { amount: 50, currency: 'USD' } }] }),
    };
    mockOrderPort = {
      createOrder: jest.fn().mockResolvedValue({ orderId: 'o1', orderNumber: 'ORD-001' }),
      findOrder: jest.fn().mockResolvedValue(null),
      updateOrderStatus: jest.fn().mockResolvedValue(undefined),
    };
    mockPaymentPort = {
      initiatePayment: jest.fn().mockResolvedValue({ transactionId: 'pi_123', clientSecret: 'secret_123' }),
    };
    useCase = new CreatePaymentIntentUseCase(
      mockCheckoutRepo as never, mockBasketPort as never, mockOrderPort as never, mockPaymentPort as never,
    );
  });

  it('should create payment intent (happy path)', async () => {
    const result = await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c1'));

    expect(result.orderId).toBe('o1');
    expect(result.paymentIntent.id).toBe('pi_123');
  });

  it('should return existing payment intent if already pending', async () => {
    mockCheckoutRepo.findById.mockResolvedValue({
      id: 'ck-1', status: 'pending_payment', paymentIntentId: 'pi_existing', orderId: 'o_existing',
    });
    mockOrderPort.findOrder.mockResolvedValue({ orderNumber: 'ORD-999' });

    const result = await useCase.execute(new CreatePaymentIntentCommand('ck-1'));

    expect(result.paymentIntent.id).toBe('pi_existing');
    expect(result.orderId).toBe('o_existing');
  });

  it('should throw CheckoutSessionNotFoundError when session not found', async () => {
    mockCheckoutRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new CreatePaymentIntentCommand('missing'))).rejects.toThrow(CheckoutSessionNotFoundError);
  });

  it('should throw CheckoutValidationError when not ready for payment', async () => {
    mockCheckoutRepo.findById.mockResolvedValue({ id: 'ck-1', status: 'pending', isReadyForPayment: false });

    await expect(useCase.execute(new CreatePaymentIntentCommand('ck-1'))).rejects.toThrow(CheckoutValidationError);
  });
});
