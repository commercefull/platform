import {
  createAddress,
  createBasketSnapshot,
  createCheckoutRepository,
  createCheckoutSession,
  createBasketSnapshotPort,
  createFraudScreeningPort,
  createOrderPlacementPort,
  createPaymentAuthorizationPort,
  emitMock,
} from '../../tests/testUtils';
import { CreatePaymentIntentUseCase, CreatePaymentIntentCommand } from './CreatePaymentIntent';
import { CheckoutSession } from '../../domain/entities/CheckoutSession';
import { CheckoutSessionNotFoundError, CheckoutValidationError } from '../../domain/errors/CheckoutErrors';
import type { FraudScreeningResult } from '../../application/ports/FraudScreeningPort';
import { Money } from '../../../../libs/money';

function readySession(overrides: Parameters<typeof createCheckoutSession>[0] = {}): CheckoutSession {
  return createCheckoutSession({
    id: 'ck-1',
    customerId: 'c-1',
    guestEmail: 'guest@test.com',
    shippingAddress: createAddress(),
    shippingMethodId: 'sm-1',
    shippingMethodName: 'Standard',
    paymentMethodId: 'pm-1',
    ...overrides,
  });
}

function fraudResult(decision: 'approved' | 'review' | 'blocked'): FraudScreeningResult {
  return {
    decision,
    riskScore: decision === 'blocked' ? 100 : decision === 'review' ? 50 : 0,
    riskLevel: decision === 'blocked' ? 'critical' : decision === 'review' ? 'medium' : 'low',
    triggeredRules: [],
  };
}

describe('CreatePaymentIntentUseCase', () => {
  let useCase: CreatePaymentIntentUseCase;
  let checkoutRepository: ReturnType<typeof createCheckoutRepository>;
  let basketSnapshotPort: ReturnType<typeof createBasketSnapshotPort>;
  let orderPlacementPort: ReturnType<typeof createOrderPlacementPort>;
  let paymentAuthorizationPort: ReturnType<typeof createPaymentAuthorizationPort>;
  let fraudScreeningPort: ReturnType<typeof createFraudScreeningPort>;

  beforeEach(() => {
    jest.clearAllMocks();
    checkoutRepository = createCheckoutRepository();
    basketSnapshotPort = createBasketSnapshotPort();
    orderPlacementPort = createOrderPlacementPort();
    paymentAuthorizationPort = createPaymentAuthorizationPort();
    fraudScreeningPort = createFraudScreeningPort();

    checkoutRepository.findById.mockResolvedValue(readySession());
    basketSnapshotPort.getSnapshot.mockResolvedValue(
      createBasketSnapshot({
        items: [
          { productId: 'p1', sku: 'SKU-1', name: 'Widget', quantity: 2, unitPrice: Money.create(50, 'USD'), itemType: 'physical', isDigital: false },
        ],
      }),
    );
    orderPlacementPort.createOrder.mockResolvedValue({ orderId: 'o-1', orderNumber: 'ORD-001', status: 'draft', paymentStatus: 'pending' });
    paymentAuthorizationPort.initiatePayment.mockResolvedValue({ transactionId: 'pi_123', status: 'requires_confirmation' });

    useCase = new CreatePaymentIntentUseCase(checkoutRepository, basketSnapshotPort, orderPlacementPort, paymentAuthorizationPort);
  });

  it('should create the order, initiate payment, persist the intent, and emit checkout.payment_initiated when the session is ready', async () => {
    const result = await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'));

    expect(result.orderId).toBe('o-1');
    expect(result.orderNumber).toBe('ORD-001');
    expect(result.paymentIntent.id).toBe('pi_123');
    expect(result.status).toBe('payment_pending');

    expect(orderPlacementPort.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'c-1', basketId: 'b-1', source: 'checkout' }),
    );
    expect(orderPlacementPort.updateOrderStatus).toHaveBeenCalledWith('o-1', 'pending_payment');
    expect(paymentAuthorizationPort.initiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'o-1', amountCents: 10000, currency: 'USD', paymentMethodId: 'pm-1' }),
    );
    expect(checkoutRepository.save).toHaveBeenCalledWith(expect.objectContaining({ paymentIntentId: 'pi_123', orderId: 'o-1' }));
    expect(emitMock).toHaveBeenCalledWith('checkout.payment_initiated', expect.objectContaining({ checkoutId: 'ck-1', orderId: 'o-1', paymentIntentId: 'pi_123' }));
  });

  it('should return the existing intent without creating a new order when payment is already pending', async () => {
    checkoutRepository.findById.mockResolvedValue(
      readySession({ status: 'pending_payment', paymentIntentId: 'pi_existing', orderId: 'o_existing' }),
    );
    orderPlacementPort.findOrder.mockResolvedValue({ orderId: 'o_existing', orderNumber: 'ORD-999', status: 'pending_payment', paymentStatus: 'pending' });

    const result = await useCase.execute(new CreatePaymentIntentCommand('ck-1'));

    expect(result.paymentIntent.id).toBe('pi_existing');
    expect(result.orderId).toBe('o_existing');
    expect(result.orderNumber).toBe('ORD-999');
    expect(orderPlacementPort.createOrder).not.toHaveBeenCalled();
    expect(paymentAuthorizationPort.initiatePayment).not.toHaveBeenCalled();
  });

  it('should throw CheckoutSessionNotFoundError when the session does not exist', async () => {
    checkoutRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(new CreatePaymentIntentCommand('missing'))).rejects.toThrow(CheckoutSessionNotFoundError);
  });

  it('should throw CheckoutValidationError when the session is not ready for payment', async () => {
    checkoutRepository.findById.mockResolvedValue(readySession({ shippingAddress: undefined, shippingMethodId: undefined }));

    await expect(useCase.execute(new CreatePaymentIntentCommand('ck-1'))).rejects.toThrow(CheckoutValidationError);
    expect(orderPlacementPort.createOrder).not.toHaveBeenCalled();
  });

  it('should throw CheckoutValidationError when the basket no longer exists', async () => {
    basketSnapshotPort.getSnapshot.mockResolvedValue(null);

    await expect(useCase.execute(new CreatePaymentIntentCommand('ck-1'))).rejects.toThrow(CheckoutValidationError);
    expect(orderPlacementPort.createOrder).not.toHaveBeenCalled();
  });

  it('should proceed with payment when fraud screening approves', async () => {
    fraudScreeningPort.screenOrder.mockResolvedValue(fraudResult('approved'));
    useCase = new CreatePaymentIntentUseCase(checkoutRepository, basketSnapshotPort, orderPlacementPort, paymentAuthorizationPort, fraudScreeningPort);

    const result = await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'));

    expect(result.paymentIntent.id).toBe('pi_123');
    expect(fraudScreeningPort.screenOrder).toHaveBeenCalledWith(expect.objectContaining({ orderId: 'o-1', orderAmountCents: 10000 }));
    expect(paymentAuthorizationPort.initiatePayment).toHaveBeenCalled();
  });

  it('should cancel the order, emit checkout.fraud_blocked, and refuse payment when screening blocks it', async () => {
    fraudScreeningPort.screenOrder.mockResolvedValue(fraudResult('blocked'));
    useCase = new CreatePaymentIntentUseCase(checkoutRepository, basketSnapshotPort, orderPlacementPort, paymentAuthorizationPort, fraudScreeningPort);

    await expect(useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'))).rejects.toThrow('Order blocked by fraud screening');

    expect(orderPlacementPort.updateOrderStatus).toHaveBeenCalledWith('o-1', 'cancelled');
    expect(paymentAuthorizationPort.initiatePayment).not.toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith('checkout.fraud_blocked', expect.objectContaining({ checkoutId: 'ck-1', orderId: 'o-1' }));
  });

  it('should proceed with payment but emit checkout.fraud_review when screening flags the order', async () => {
    fraudScreeningPort.screenOrder.mockResolvedValue(fraudResult('review'));
    useCase = new CreatePaymentIntentUseCase(checkoutRepository, basketSnapshotPort, orderPlacementPort, paymentAuthorizationPort, fraudScreeningPort);

    const result = await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'));

    expect(result.paymentIntent.id).toBe('pi_123');
    expect(paymentAuthorizationPort.initiatePayment).toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith('checkout.fraud_review', expect.objectContaining({ checkoutId: 'ck-1', orderId: 'o-1' }));
  });

  it('should fail open and still initiate payment when the screening service throws', async () => {
    fraudScreeningPort.screenOrder.mockRejectedValue(new Error('Screening service unavailable'));
    useCase = new CreatePaymentIntentUseCase(checkoutRepository, basketSnapshotPort, orderPlacementPort, paymentAuthorizationPort, fraudScreeningPort);

    const result = await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'));

    expect(result.orderId).toBe('o-1');
    expect(paymentAuthorizationPort.initiatePayment).toHaveBeenCalled();
  });

  it('should propagate payment gateway failures without persisting an intent', async () => {
    paymentAuthorizationPort.initiatePayment.mockRejectedValue(new Error('gateway timeout'));

    await expect(useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'))).rejects.toThrow('gateway timeout');
    expect(checkoutRepository.save).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalledWith('checkout.payment_initiated', expect.anything());
  });
});
