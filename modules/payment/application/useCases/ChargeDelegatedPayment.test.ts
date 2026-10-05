import { emitMock } from '../../tests/testUtils';
import { PaymentTransaction } from '../../domain/entities/PaymentTransaction';
import { ChargeDelegatedPaymentUseCase, ChargeDelegatedPaymentCommand } from './ChargeDelegatedPayment';
import { TransactionNotFoundError, InvalidStatusTransitionError, ChargeDelegatedPaymentError } from '../../domain/errors/PaymentErrors';

function pendingTransaction(): PaymentTransaction {
  return PaymentTransaction.create({
    transactionId: 'txn-1',
    orderId: 'order-1',
    paymentMethodConfigId: 'pmc-1',
    gatewayId: 'gw-1',
    amountCents: 5000,
    currency: 'usd',
  });
}

const COMMAND = new ChargeDelegatedPaymentCommand(
  'org-1',
  'order-1',
  'txn-1',
  5000,
  'USD',
  { provider: 'stripe', credentialType: 'spt', token: 'spt_abc' },
  'cust-1',
  'c@x.com',
);

function makeUseCase() {
  const payments = {
    findTransactionById: jest.fn(async (_id: string): Promise<PaymentTransaction | null> => pendingTransaction()),
    saveTransaction: jest.fn(async (t: PaymentTransaction) => t),
  };
  const routePayment = {
    execute: jest.fn(async () => ({
      success: true,
      provider: 'stripe',
      externalTransactionId: 'pi_stripe_1',
      status: 'captured',
      redirectUrl: undefined,
      attempts: [{ provider: 'stripe', success: true, errorCode: undefined, errorMessage: undefined, latencyMs: 10 }],
    })),
  };
  const orderStatusSync = {
    findCheckoutByPaymentIntentId: jest.fn(async (_id: string) => ({
      checkoutId: 'co-1',
      orderId: 'order-1',
      customerId: 'cust-1',
      totalAmountCents: 5000,
      orderNumber: 'ORD-1',
    })),
    markOrderPaid: jest.fn(async (_id: string) => ({ orderNumber: 'ORD-1' })),
  };
  return {
    useCase: new ChargeDelegatedPaymentUseCase(payments, routePayment as never, orderStatusSync),
    payments,
    routePayment,
    orderStatusSync,
  };
}

describe('ChargeDelegatedPaymentUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should charge the delegated token and mark transaction paid when the PSP captures', async () => {
    const { useCase, payments, routePayment, orderStatusSync } = makeUseCase();

    const result = await useCase.execute(COMMAND);

    expect(result.status).toBe('paid');
    expect(result.externalTransactionId).toBe('pi_stripe_1');
    expect(routePayment.execute).toHaveBeenCalledWith(expect.objectContaining({ paymentMethodToken: 'spt_abc', orderId: 'order-1' }));
    expect(orderStatusSync.markOrderPaid).toHaveBeenCalledWith('order-1');
    expect(emitMock).toHaveBeenCalledWith('order.paid', expect.objectContaining({ orderId: 'order-1' }));
    expect(emitMock).toHaveBeenCalledWith('checkout.payment_captured', expect.objectContaining({ checkoutId: 'co-1' }));
    const saved = payments.saveTransaction.mock.calls[0][0];
    expect(saved.isPaid).toBe(true);
  });

  it('should mark the transaction failed and throw when the PSP declines', async () => {
    const { useCase, payments, routePayment } = makeUseCase();
    routePayment.execute.mockRejectedValue(new Error('All payment providers exhausted'));

    await expect(useCase.execute(COMMAND)).rejects.toThrow(ChargeDelegatedPaymentError);
    const saved = payments.saveTransaction.mock.calls[0][0];
    expect(saved.isFailed).toBe(true);
    expect(emitMock).not.toHaveBeenCalledWith('order.paid', expect.anything());
  });

  it('should mark the transaction failed when routing returns a non-charge status', async () => {
    const { useCase, payments, routePayment } = makeUseCase();
    routePayment.execute.mockResolvedValue({
      success: true,
      provider: 'stripe',
      externalTransactionId: 'pi_x',
      status: 'pending',
      redirectUrl: undefined,
      attempts: [],
    });

    await expect(useCase.execute(COMMAND)).rejects.toThrow(ChargeDelegatedPaymentError);
    expect(payments.saveTransaction.mock.calls[0][0].isFailed).toBe(true);
  });

  it('should return the paid result without re-charging when the transaction is already paid', async () => {
    const { useCase, routePayment, payments } = makeUseCase();
    const paid = pendingTransaction();
    paid.markAsPaid('pi_existing');
    payments.findTransactionById.mockResolvedValue(paid);

    const result = await useCase.execute(COMMAND);

    expect(routePayment.execute).not.toHaveBeenCalled();
    expect(result.externalTransactionId).toBe('pi_existing');
  });

  it('should throw when the transaction does not exist', async () => {
    const { useCase, payments } = makeUseCase();
    payments.findTransactionById.mockResolvedValue(null);

    await expect(useCase.execute(COMMAND)).rejects.toThrow(TransactionNotFoundError);
  });

  it('should throw when the transaction is in a non-chargeable state', async () => {
    const { useCase, payments } = makeUseCase();
    const failed = pendingTransaction();
    failed.fail('card_declined', 'declined');
    payments.findTransactionById.mockResolvedValue(failed);

    await expect(useCase.execute(COMMAND)).rejects.toThrow(InvalidStatusTransitionError);
  });
});
