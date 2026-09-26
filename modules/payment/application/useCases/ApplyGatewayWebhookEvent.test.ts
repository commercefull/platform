import { ApplyGatewayWebhookEventUseCase } from './ApplyGatewayWebhookEvent';
import { ProcessPaymentWebhookUseCase } from './ProcessPaymentWebhook';
import type { PaymentRepository } from '../../domain/repositories/PaymentRepository';
import type { PaymentTransaction } from '../../domain/entities/PaymentTransaction';
import type { GatewayWebhookPort } from '../ports/GatewayWebhookPort';
import type { OrderStatusSyncPort } from '../ports/OrderStatusSyncPort';
import { lazyMock, emitMock, createPaymentWebhook } from '../../tests/testUtils';

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));
jest.mock('../../../../libs/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const succeededPayload = {
  type: 'payment_intent.succeeded',
  data: { object: { id: 'pi_123' } },
};

const succeededEvent = {
  type: 'payment_succeeded' as const,
  externalTransactionId: 'pi_123',
  gatewayResponse: { raw: true },
};

const checkoutSummary = {
  checkoutId: 'co-1',
  orderId: 'ord-1',
  customerId: 'cust-1',
  totalAmountCents: 5000,
  orderNumber: 'ORD-1',
};

const makeTransaction = (status: string): PaymentTransaction =>
  ({
    status,
    markAsPaid: jest.fn(),
    fail: jest.fn(),
  }) as unknown as PaymentTransaction;

describe('ApplyGatewayWebhookEventUseCase', () => {
  let payments: jest.Mocked<PaymentRepository>;
  let gatewayWebhooks: jest.Mocked<GatewayWebhookPort>;
  let orderStatusSync: jest.Mocked<OrderStatusSyncPort>;
  let useCase: ApplyGatewayWebhookEventUseCase;

  beforeEach(() => {
    payments = lazyMock<PaymentRepository>();
    gatewayWebhooks = lazyMock<GatewayWebhookPort>();
    orderStatusSync = lazyMock<OrderStatusSyncPort>();
    useCase = new ApplyGatewayWebhookEventUseCase(
      payments,
      gatewayWebhooks,
      orderStatusSync,
      new ProcessPaymentWebhookUseCase(payments),
    );
    emitMock.mockClear();
    payments.findWebhookByExternalId.mockResolvedValue(null);
    payments.createWebhook.mockResolvedValue(createPaymentWebhook());
  });

  it('should acknowledge an already-recorded webhook without side effects', async () => {
    payments.findWebhookByExternalId.mockResolvedValue(createPaymentWebhook());

    await useCase.execute('stripe', succeededPayload);

    expect(gatewayWebhooks.normalize).not.toHaveBeenCalled();
    expect(payments.saveTransaction).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should acknowledge an unrecognised event', async () => {
    gatewayWebhooks.normalize.mockReturnValue(null);

    await useCase.execute('stripe', succeededPayload);

    expect(payments.findTransactionByExternalId).not.toHaveBeenCalled();
  });

  it('should acknowledge when the transaction is not found', async () => {
    gatewayWebhooks.normalize.mockReturnValue(succeededEvent);
    payments.findTransactionByExternalId.mockResolvedValue(null);

    await useCase.execute('stripe', succeededPayload);

    expect(payments.saveTransaction).not.toHaveBeenCalled();
  });

  it('should mark the transaction paid, sync the order, and emit both events', async () => {
    const transaction = makeTransaction('pending');
    gatewayWebhooks.normalize.mockReturnValue(succeededEvent);
    payments.findTransactionByExternalId.mockResolvedValue(transaction);
    orderStatusSync.findCheckoutByPaymentIntentId.mockResolvedValue(checkoutSummary);
    orderStatusSync.markOrderPaid.mockResolvedValue({ orderNumber: 'ORD-9' });

    await useCase.execute('stripe', succeededPayload);

    expect(transaction.markAsPaid).toHaveBeenCalledWith('pi_123', succeededEvent.gatewayResponse);
    expect(payments.saveTransaction).toHaveBeenCalledWith(transaction);
    expect(orderStatusSync.markOrderPaid).toHaveBeenCalledWith('ord-1');
    expect(emitMock).toHaveBeenCalledWith('order.paid', {
      orderId: 'ord-1',
      orderNumber: 'ORD-9',
      customerId: 'cust-1',
      totalAmountCents: 5000,
      amountCents: 5000,
    });
    expect(emitMock).toHaveBeenCalledWith('checkout.payment_captured', {
      checkoutId: 'co-1',
      orderId: 'ord-1',
      paymentIntentId: 'pi_123',
    });
  });

  it('should skip an already-paid transaction', async () => {
    gatewayWebhooks.normalize.mockReturnValue(succeededEvent);
    payments.findTransactionByExternalId.mockResolvedValue(makeTransaction('paid'));

    await useCase.execute('stripe', succeededPayload);

    expect(payments.saveTransaction).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should fail the transaction and emit failure events', async () => {
    const transaction = makeTransaction('pending');
    gatewayWebhooks.normalize.mockReturnValue({
      type: 'payment_failed',
      externalTransactionId: 'pi_123',
      errorCode: 'card_declined',
      errorMessage: 'Card declined',
      gatewayResponse: {},
    });
    payments.findTransactionByExternalId.mockResolvedValue(transaction);
    orderStatusSync.findCheckoutByPaymentIntentId.mockResolvedValue(checkoutSummary);

    await useCase.execute('stripe', succeededPayload);

    expect(transaction.fail).toHaveBeenCalledWith('card_declined', 'Card declined', {});
    expect(emitMock).toHaveBeenCalledWith('order.payment_failed', {
      orderId: 'ord-1',
      customerId: 'cust-1',
      reason: 'Card declined',
    });
    expect(emitMock).toHaveBeenCalledWith('checkout.failed', {
      checkoutId: 'co-1',
      orderId: 'ord-1',
      reason: 'Card declined',
    });
  });

  it('should still save the transaction when no checkout correlates', async () => {
    const transaction = makeTransaction('pending');
    gatewayWebhooks.normalize.mockReturnValue(succeededEvent);
    payments.findTransactionByExternalId.mockResolvedValue(transaction);
    orderStatusSync.findCheckoutByPaymentIntentId.mockResolvedValue(null);

    await useCase.execute('stripe', succeededPayload);

    expect(payments.saveTransaction).toHaveBeenCalledWith(transaction);
    expect(emitMock).not.toHaveBeenCalled();
  });
});
