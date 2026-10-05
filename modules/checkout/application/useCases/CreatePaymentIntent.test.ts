import {
  createAddress,
  createBasketSnapshot,
  createCheckoutRepository,
  createCheckoutSession,
  createBasketSnapshotPort,
  createFraudScreeningPort,
  createLoyaltyRedemptionPort,
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
          {
            productId: 'p1',
            sku: 'SKU-1',
            name: 'Widget',
            quantity: 2,
            unitPrice: Money.create(50, 'USD'),
            itemType: 'physical',
            isDigital: false,
          },
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
      expect.objectContaining({
        customerId: 'c-1',
        basketId: 'b-1',
        storeId: 'store-1',
        channelId: 'channel-1',
        source: 'checkout',
      }),
    );
    expect(orderPlacementPort.updateOrderStatus).toHaveBeenCalledWith('o-1', 'pending_payment');
    expect(paymentAuthorizationPort.initiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'o-1', amountCents: 10000, currency: 'USD', paymentMethodId: 'pm-1' }),
    );
    expect(checkoutRepository.save).toHaveBeenCalledWith(expect.objectContaining({ paymentIntentId: 'pi_123', orderId: 'o-1' }));
    expect(emitMock).toHaveBeenCalledWith(
      'checkout.payment_initiated',
      expect.objectContaining({ checkoutId: 'ck-1', orderId: 'o-1', paymentIntentId: 'pi_123' }),
    );
  });

  it('should link reservations to the created order lines', async () => {
    const inventoryReservationPort = {
      reserveForOrder: jest.fn().mockResolvedValue({ reservationId: 'res-1', allReserved: true, shortfalls: [] }),
      releaseForOrder: jest.fn(),
      confirmForOrder: jest.fn(),
    };
    useCase = new CreatePaymentIntentUseCase(
      checkoutRepository,
      basketSnapshotPort,
      orderPlacementPort,
      paymentAuthorizationPort,
      undefined,
      inventoryReservationPort,
    );
    orderPlacementPort.createOrder.mockResolvedValue({
      orderId: 'o-1',
      orderNumber: 'ORD-001',
      status: 'draft',
      paymentStatus: 'pending',
      items: [{ orderItemId: 'oi-1', productId: 'p1' }],
    });

    await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'));

    expect(inventoryReservationPort.reserveForOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'o-1',
        items: [expect.objectContaining({ productId: 'p1', orderItemId: 'oi-1' })],
      }),
    );
  });

  it('should re-validate a stale auto-promotion discount at the payment boundary', async () => {
    const session = readySession();
    session.applyCoupon('AUTO_PROMOTION', Money.create(10, 'USD'));
    checkoutRepository.findById.mockResolvedValue(session);
    const promotionQuotePort = { evaluatePromotions: jest.fn().mockResolvedValue({ totalDiscountAmountCents: 0, appliedPromotions: [] }) };
    useCase = new CreatePaymentIntentUseCase(
      checkoutRepository,
      basketSnapshotPort,
      orderPlacementPort,
      paymentAuthorizationPort,
      undefined,
      undefined,
      undefined,
      promotionQuotePort,
    );

    const result = await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'));

    expect(result.status).toBe('payment_pending');
    // Promotion expired → discount removed and the full $100 charged
    expect(paymentAuthorizationPort.initiatePayment).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 10000 }));
    expect(checkoutRepository.save).toHaveBeenCalledWith(expect.objectContaining({ couponCode: undefined }));
  });

  it('should keep a still-valid auto-promotion discount at the payment boundary', async () => {
    const session = readySession();
    session.applyCoupon('AUTO_PROMOTION', Money.create(10, 'USD'));
    checkoutRepository.findById.mockResolvedValue(session);
    const promotionQuotePort = {
      evaluatePromotions: jest
        .fn()
        .mockResolvedValue({ totalDiscountAmountCents: 1000, appliedPromotions: [{ id: 'pr-1', name: 'Auto', amountCents: 1000 }] }),
    };
    useCase = new CreatePaymentIntentUseCase(
      checkoutRepository,
      basketSnapshotPort,
      orderPlacementPort,
      paymentAuthorizationPort,
      undefined,
      undefined,
      undefined,
      promotionQuotePort,
    );

    await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'));

    expect(paymentAuthorizationPort.initiatePayment).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 9000 }));
  });

  it('should reject the order when the requote reports unpurchasable products', async () => {
    basketSnapshotPort.getSnapshot.mockResolvedValue(
      createBasketSnapshot({
        unpurchasableProductIds: ['p1'],
        items: [
          {
            productId: 'p1',
            sku: 'SKU-1',
            name: 'Widget',
            quantity: 2,
            unitPrice: Money.create(50, 'USD'),
            itemType: 'physical',
            isDigital: false,
          },
        ],
      }),
    );

    await expect(useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'))).rejects.toThrow('Products no longer purchasable');
    expect(orderPlacementPort.createOrder).not.toHaveBeenCalled();
    expect(paymentAuthorizationPort.initiatePayment).not.toHaveBeenCalled();
  });

  it('should resync session totals and charge the repriced amount when prices changed', async () => {
    basketSnapshotPort.getSnapshot.mockResolvedValue(
      createBasketSnapshot({
        repriced: true,
        couponCode: 'SAVE10',
        discountAmountCents: 2000,
        subtotal: Money.create(120, 'USD'),
        items: [
          {
            productId: 'p1',
            sku: 'SKU-1',
            name: 'Widget',
            quantity: 2,
            unitPrice: Money.create(60, 'USD'),
            itemType: 'physical',
            isDigital: false,
          },
        ],
      }),
    );

    const result = await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'));

    expect(result.status).toBe('payment_pending');
    // repriced subtotal $120 − $20 coupon = $100 charged
    expect(paymentAuthorizationPort.initiatePayment).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 10000, currency: 'USD' }));
    expect(orderPlacementPort.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ items: [expect.objectContaining({ productId: 'p1', unitPriceCents: 6000 })] }),
    );
    expect(checkoutRepository.save).toHaveBeenCalled();
  });

  it('should surface requote price changes for client confirmation', async () => {
    basketSnapshotPort.getSnapshot.mockResolvedValue(
      createBasketSnapshot({
        repriced: true,
        priceChanges: [
          { basketItemId: 'bi-1', productId: 'p1', productVariantId: 'v1', previousUnitPriceCents: 5000, unitPriceCents: 6000 },
        ],
      }),
    );

    const result = await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'));

    expect(result.priceChanged).toBe(true);
    expect(result.priceChanges).toEqual([expect.objectContaining({ productId: 'p1', previousUnitPriceCents: 5000, unitPriceCents: 6000 })]);
    expect(checkoutRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          priceChanges: [expect.objectContaining({ productId: 'p1', previousUnitPriceCents: 5000, unitPriceCents: 6000 })],
        }),
      }),
    );
  });

  it('should debit loyalty points for the applied reward after order creation', async () => {
    const loyaltyRedemptionPort = createLoyaltyRedemptionPort();
    loyaltyRedemptionPort.redeemPoints.mockResolvedValue({ transactionId: 'lpt-1' });
    checkoutRepository.findById.mockResolvedValue(
      readySession({
        customerId: 'cust-1',
        loyaltyRewardId: 'rw-1',
        loyaltyPointsRedeemed: 500,
        loyaltyDiscountAmount: Money.create(5, 'USD'),
      }),
    );

    useCase = new CreatePaymentIntentUseCase(
      checkoutRepository,
      basketSnapshotPort,
      orderPlacementPort,
      paymentAuthorizationPort,
      fraudScreeningPort,
      undefined,
      undefined,
      undefined,
      loyaltyRedemptionPort,
    );

    await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'cust-1'));

    expect(loyaltyRedemptionPort.redeemPoints).toHaveBeenCalledWith({
      customerId: 'cust-1',
      points: 500,
      orderId: 'o-1',
      rewardId: 'rw-1',
    });
    expect(paymentAuthorizationPort.initiatePayment).toHaveBeenCalled();
  });

  it('should cancel the order and skip payment when loyalty redemption fails', async () => {
    const loyaltyRedemptionPort = createLoyaltyRedemptionPort();
    loyaltyRedemptionPort.redeemPoints.mockRejectedValue(new Error('Insufficient points'));
    checkoutRepository.findById.mockResolvedValue(
      readySession({
        customerId: 'cust-1',
        loyaltyRewardId: 'rw-1',
        loyaltyPointsRedeemed: 500,
        loyaltyDiscountAmount: Money.create(5, 'USD'),
      }),
    );

    useCase = new CreatePaymentIntentUseCase(
      checkoutRepository,
      basketSnapshotPort,
      orderPlacementPort,
      paymentAuthorizationPort,
      fraudScreeningPort,
      undefined,
      undefined,
      undefined,
      loyaltyRedemptionPort,
    );

    await expect(useCase.execute(new CreatePaymentIntentCommand('ck-1', 'cust-1'))).rejects.toThrow('Loyalty points could not be redeemed');
    expect(orderPlacementPort.cancelOrder).toHaveBeenCalledWith('o-1', 'loyalty_redemption_failed');
    expect(paymentAuthorizationPort.initiatePayment).not.toHaveBeenCalled();
  });

  it('should forward the session delegated credential to payment authorization', async () => {
    const delegatedCredential = { provider: 'stripe', credentialType: 'spt', token: 'spt_token_123' };
    checkoutRepository.findById.mockResolvedValue(
      readySession({ paymentMethodId: 'delegated:stripe', metadata: { delegatedPaymentCredential: delegatedCredential } }),
    );

    await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'));

    expect(paymentAuthorizationPort.initiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'o-1',
        paymentMethodId: 'delegated:stripe',
        delegatedCredential,
      }),
    );
  });

  it('should initiate payment without a delegated credential for regular checkouts', async () => {
    await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'));

    const request = paymentAuthorizationPort.initiatePayment.mock.calls[0][0] as { delegatedCredential?: unknown };
    expect(request.delegatedCredential).toBeUndefined();
  });

  it('should return the existing intent without creating a new order when payment is already pending', async () => {
    checkoutRepository.findById.mockResolvedValue(
      readySession({ status: 'pending_payment', paymentIntentId: 'pi_existing', orderId: 'o_existing' }),
    );
    orderPlacementPort.findOrder.mockResolvedValue({
      orderId: 'o_existing',
      orderNumber: 'ORD-999',
      status: 'pending_payment',
      paymentStatus: 'pending',
    });

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
    useCase = new CreatePaymentIntentUseCase(
      checkoutRepository,
      basketSnapshotPort,
      orderPlacementPort,
      paymentAuthorizationPort,
      fraudScreeningPort,
    );

    const result = await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'));

    expect(result.paymentIntent.id).toBe('pi_123');
    expect(fraudScreeningPort.screenOrder).toHaveBeenCalledWith(expect.objectContaining({ orderId: 'o-1', orderAmountCents: 10000 }));
    expect(paymentAuthorizationPort.initiatePayment).toHaveBeenCalled();
  });

  it('should cancel the order, emit checkout.fraud_blocked, and refuse payment when screening blocks it', async () => {
    fraudScreeningPort.screenOrder.mockResolvedValue(fraudResult('blocked'));
    useCase = new CreatePaymentIntentUseCase(
      checkoutRepository,
      basketSnapshotPort,
      orderPlacementPort,
      paymentAuthorizationPort,
      fraudScreeningPort,
    );

    await expect(useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'))).rejects.toThrow('Order blocked by fraud screening');

    expect(orderPlacementPort.cancelOrder).toHaveBeenCalledWith('o-1', 'fraud_blocked');
    expect(paymentAuthorizationPort.initiatePayment).not.toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith('checkout.fraud_blocked', expect.objectContaining({ checkoutId: 'ck-1', orderId: 'o-1' }));
  });

  it('should proceed with payment but emit checkout.fraud_review when screening flags the order', async () => {
    fraudScreeningPort.screenOrder.mockResolvedValue(fraudResult('review'));
    useCase = new CreatePaymentIntentUseCase(
      checkoutRepository,
      basketSnapshotPort,
      orderPlacementPort,
      paymentAuthorizationPort,
      fraudScreeningPort,
    );

    const result = await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'));

    expect(result.paymentIntent.id).toBe('pi_123');
    expect(paymentAuthorizationPort.initiatePayment).toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith('checkout.fraud_review', expect.objectContaining({ checkoutId: 'ck-1', orderId: 'o-1' }));
  });

  it('should fail open and still initiate payment when the screening service throws', async () => {
    fraudScreeningPort.screenOrder.mockRejectedValue(new Error('Screening service unavailable'));
    useCase = new CreatePaymentIntentUseCase(
      checkoutRepository,
      basketSnapshotPort,
      orderPlacementPort,
      paymentAuthorizationPort,
      fraudScreeningPort,
    );

    const result = await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'));

    expect(result.orderId).toBe('o-1');
    expect(paymentAuthorizationPort.initiatePayment).toHaveBeenCalled();
  });

  it('should propagate payment gateway failures without persisting an intent', async () => {
    paymentAuthorizationPort.initiatePayment.mockRejectedValue(new Error('gateway timeout'));

    await expect(useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'))).rejects.toThrow('gateway timeout');
    // Only the order-attach save may run — the payment-intent save must not.
    expect(checkoutRepository.save).toHaveBeenCalledTimes(1);
    expect(checkoutRepository.save).toHaveBeenCalledWith(expect.objectContaining({ paymentIntentId: undefined }));
    expect(emitMock).not.toHaveBeenCalledWith('checkout.payment_initiated', expect.anything());
  });

  // ------------------------------------------------------------------
  // Replay matrix — a retried intent must not duplicate downstream effects
  // ------------------------------------------------------------------

  it('should resume the attached order instead of placing a duplicate when a retry finds session.orderId', async () => {
    checkoutRepository.findById.mockResolvedValue(readySession({ orderId: 'o-existing' }));
    orderPlacementPort.findOrder.mockResolvedValue({
      orderId: 'o-existing',
      orderNumber: 'ORD-EXISTING',
      status: 'pending',
      paymentStatus: 'pending',
      items: [{ orderItemId: 'oi-9', productId: 'p1' }],
    });

    const result = await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'));

    expect(orderPlacementPort.createOrder).not.toHaveBeenCalled();
    expect(result.orderId).toBe('o-existing');
    expect(result.orderNumber).toBe('ORD-EXISTING');
    expect(paymentAuthorizationPort.initiatePayment).toHaveBeenCalledWith(expect.objectContaining({ orderId: 'o-existing' }));
    expect(checkoutRepository.save).toHaveBeenCalledWith(expect.objectContaining({ paymentIntentId: 'pi_123', orderId: 'o-existing' }));
  });

  it('should not re-transition the order when the resumed order is already pending_payment', async () => {
    checkoutRepository.findById.mockResolvedValue(readySession({ orderId: 'o-existing' }));
    orderPlacementPort.findOrder.mockResolvedValue({
      orderId: 'o-existing',
      orderNumber: 'ORD-EXISTING',
      status: 'pending_payment',
      paymentStatus: 'pending',
    });

    await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'));

    expect(orderPlacementPort.updateOrderStatus).not.toHaveBeenCalled();
  });

  it('should re-debit loyalty against the same orderId on retry so the port dedupes per order', async () => {
    const loyaltyRedemptionPort = createLoyaltyRedemptionPort();
    loyaltyRedemptionPort.redeemPoints.mockResolvedValue({ transactionId: 'lt-1' });
    useCase = new CreatePaymentIntentUseCase(
      checkoutRepository,
      basketSnapshotPort,
      orderPlacementPort,
      paymentAuthorizationPort,
      undefined,
      undefined,
      undefined,
      undefined,
      loyaltyRedemptionPort,
    );
    checkoutRepository.findById.mockResolvedValue(
      readySession({ orderId: 'o-existing', loyaltyRewardId: 'rw-1', loyaltyPointsRedeemed: 500 }),
    );
    orderPlacementPort.findOrder.mockResolvedValue({
      orderId: 'o-existing',
      orderNumber: 'ORD-EXISTING',
      status: 'pending_payment',
      paymentStatus: 'pending',
    });

    await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'));

    // Same orderId on replay — the loyalty adapter is idempotent per orderId.
    expect(loyaltyRedemptionPort.redeemPoints).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'c-1', points: 500, orderId: 'o-existing', rewardId: 'rw-1' }),
    );
  });

  it('should place a fresh order when the attached order was cancelled by a failed attempt', async () => {
    checkoutRepository.findById.mockResolvedValue(readySession({ orderId: 'o-cancelled' }));
    orderPlacementPort.findOrder.mockResolvedValue({
      orderId: 'o-cancelled',
      orderNumber: 'ORD-OLD',
      status: 'cancelled',
      paymentStatus: 'pending',
    });

    const result = await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'));

    expect(orderPlacementPort.createOrder).toHaveBeenCalledTimes(1);
    expect(result.orderId).toBe('o-1');
  });

  it('should place a fresh order when the attached orderId no longer resolves', async () => {
    checkoutRepository.findById.mockResolvedValue(readySession({ orderId: 'o-stale' }));
    orderPlacementPort.findOrder.mockResolvedValue(null);

    const result = await useCase.execute(new CreatePaymentIntentCommand('ck-1', 'c-1'));

    expect(orderPlacementPort.createOrder).toHaveBeenCalledTimes(1);
    expect(result.orderId).toBe('o-1');
  });
});
