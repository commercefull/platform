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
        id: 'ck-1',
        basketId: 'b1',
        customerId: 'c1',
        guestEmail: 'test@test.com',
        status: 'pending',
        isReadyForPayment: true,
        paymentIntentId: null,
        orderId: null,
        subtotal: { amount: 100, currency: 'USD' },
        total: { amount: 100, currency: 'USD' },
        shippingAmount: { amount: 0, currency: 'USD' },
        taxAmount: { amount: 0, currency: 'USD' },
        discountAmount: { amount: 0, currency: 'USD' },
        shippingAddress: {},
        shippingMethodId: 'sm1',
        paymentMethodId: 'pm1',
        notes: undefined,
        metadata: undefined,
        couponCode: undefined,
        setPaymentIntent: jest.fn(),
      }),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockBasketPort = {
      getSnapshot: jest
        .fn()
        .mockResolvedValue({ items: [{ productId: 'p1', name: 'Widget', quantity: 2, unitPrice: { amount: 50, currency: 'USD' } }] }),
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
      mockCheckoutRepo as never,
      mockBasketPort as never,
      mockOrderPort as never,
      mockPaymentPort as never,
    );
  });

  it('should create payment intent (happy path)', async () => {
    const result = await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c1'));

    expect(result.orderId).toBe('o1');
    expect(result.paymentIntent.id).toBe('pi_123');
  });

  it('should return existing payment intent if already pending', async () => {
    mockCheckoutRepo.findById.mockResolvedValue({
      id: 'ck-1',
      status: 'pending_payment',
      paymentIntentId: 'pi_existing',
      orderId: 'o_existing',
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

  // ========================================================================
  // Epic G — Fraud screening integration
  // ========================================================================

  function makeFraudPort(decision: 'approved' | 'review' | 'blocked' = 'approved'): Record<string, jest.Mock> {
    return {
      screenOrder: jest.fn().mockResolvedValue({
        decision,
        riskScore: decision === 'blocked' ? 100 : decision === 'review' ? 50 : 0,
        riskLevel: decision === 'blocked' ? 'critical' : decision === 'review' ? 'medium' : 'low',
        triggeredRules: decision === 'approved' ? [] : [{ ruleId: 'r1', name: 'Rule', action: decision }],
      }),
    };
  }

  it('should proceed with payment when fraud screening approves', async () => {
    const fraudPort = makeFraudPort('approved');
    const uc = new CreatePaymentIntentUseCase(
      mockCheckoutRepo as never,
      mockBasketPort as never,
      mockOrderPort as never,
      mockPaymentPort as never,
      fraudPort as never,
    );

    const result = await uc.execute(new CreatePaymentIntentCommand('ck-1', 'c1'));

    expect(result.orderId).toBe('o1');
    expect(result.paymentIntent.id).toBe('pi_123');
    expect(fraudPort.screenOrder).toHaveBeenCalled();
    expect(mockPaymentPort.initiatePayment).toHaveBeenCalled();
  });

  it('should block payment when fraud screening returns blocked', async () => {
    const fraudPort = makeFraudPort('blocked');
    const uc = new CreatePaymentIntentUseCase(
      mockCheckoutRepo as never,
      mockBasketPort as never,
      mockOrderPort as never,
      mockPaymentPort as never,
      fraudPort as never,
    );

    await expect(uc.execute(new CreatePaymentIntentCommand('ck-1', 'c1'))).rejects.toThrow('Order blocked by fraud screening');

    // Payment should NOT be initiated for blocked orders
    expect(mockPaymentPort.initiatePayment).not.toHaveBeenCalled();
    // Order should be cancelled
    expect(mockOrderPort.updateOrderStatus).toHaveBeenCalledWith('o1', 'cancelled');
  });

  it('should proceed with payment when fraud screening returns review', async () => {
    const fraudPort = makeFraudPort('review');
    const uc = new CreatePaymentIntentUseCase(
      mockCheckoutRepo as never,
      mockBasketPort as never,
      mockOrderPort as never,
      mockPaymentPort as never,
      fraudPort as never,
    );

    const result = await uc.execute(new CreatePaymentIntentCommand('ck-1', 'c1'));

    // Review orders still proceed with payment (flagged for manual review)
    expect(result.orderId).toBe('o1');
    expect(result.paymentIntent.id).toBe('pi_123');
    expect(mockPaymentPort.initiatePayment).toHaveBeenCalled();
  });

  it('should not screen when no fraud screening port is provided', async () => {
    const result = await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c1'));

    expect(result.orderId).toBe('o1');
    // No screening should happen — backward compatible
  });

  it('should fail open when fraud screening throws an error', async () => {
    const fraudPort = { screenOrder: jest.fn().mockRejectedValue(new Error('Screening service unavailable')) };
    const uc = new CreatePaymentIntentUseCase(
      mockCheckoutRepo as never,
      mockBasketPort as never,
      mockOrderPort as never,
      mockPaymentPort as never,
      fraudPort as never,
    );

    const result = await uc.execute(new CreatePaymentIntentCommand('ck-1', 'c1'));

    // Should proceed with payment despite screening failure (fail-open)
    expect(result.orderId).toBe('o1');
    expect(mockPaymentPort.initiatePayment).toHaveBeenCalled();
  });
});
