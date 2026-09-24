import { PaymentPaymentAuthorizationAdapter } from './PaymentPaymentAuthorizationAdapter';
import type { InitiatePaymentUseCase } from '../../../payment/application/useCases/InitiatePayment';

describe('PaymentPaymentAuthorizationAdapter', () => {
  let adapter: PaymentPaymentAuthorizationAdapter;
  let initiatePaymentUseCase: jest.Mocked<Pick<InitiatePaymentUseCase, 'execute'>>;

  beforeEach(() => {
    initiatePaymentUseCase = {
      execute: jest.fn().mockResolvedValue({ transactionId: 'txn-123' }),
    };
    adapter = new PaymentPaymentAuthorizationAdapter(initiatePaymentUseCase as unknown as InitiatePaymentUseCase);
  });

  it('implements PaymentAuthorizationPort', () => {
    expect(typeof adapter.initiatePayment).toBe('function');
  });

  it('should initiate payment and return transaction result', async () => {
    const result = await adapter.initiatePayment({
      orderId: 'order-1',
      amountCents: 100,
      currency: 'USD',
      paymentMethodId: 'pm-1',
      customerId: 'cust-1',
    });

    expect(initiatePaymentUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        amountCents: 100,
        currency: 'USD',
        paymentMethodConfigId: 'pm-1',
        customerId: 'cust-1',
      }),
    );
    expect(result.transactionId).toBe('txn-123');
    expect(result.status).toBe('initiated');
  });

  it('should throw with cause when payment initiation fails', async () => {
    initiatePaymentUseCase.execute.mockRejectedValue(new Error('Gateway down'));

    await expect(
      adapter.initiatePayment({
        orderId: 'order-1',
        amountCents: 100,
        currency: 'USD',
        paymentMethodId: 'pm-1',
      }),
    ).rejects.toThrow('Gateway down');
  });
});
