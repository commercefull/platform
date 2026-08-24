/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */

describe('PaymentPaymentAuthorizationAdapter', () => {
  let adapter: import('./PaymentPaymentAuthorizationAdapter').PaymentPaymentAuthorizationAdapter;
  let mockPaymentRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../../payment/application/useCases/InitiatePayment', () => ({
      InitiatePaymentUseCase: jest.fn().mockImplementation((_repo: any) => ({
        execute: jest.fn().mockResolvedValue({ transactionId: 'txn-123' }),
      })),
      InitiatePaymentCommand: jest.fn().mockImplementation((...args: any[]) => ({ args })),
    }));

    mockPaymentRepo = {};
    const { PaymentPaymentAuthorizationAdapter } = require('./PaymentPaymentAuthorizationAdapter');
    adapter = new PaymentPaymentAuthorizationAdapter(mockPaymentRepo as never);
  });

  afterEach(() => {
    jest.dontMock('../../../payment/application/useCases/InitiatePayment');
  });

  it('implements PaymentAuthorizationPort', () => {
    expect(typeof adapter.initiatePayment).toBe('function');
  });

  it('should initiate payment and return transaction result', async () => {
    const result = await adapter.initiatePayment({
      orderId: 'order-1',
      amount: 100,
      currency: 'USD',
      paymentMethodId: 'pm-1',
      customerId: 'cust-1',
    });

    expect(result.transactionId).toBe('txn-123');
    expect(result.status).toBe('initiated');
  });

  it('should throw with cause when payment initiation fails', async () => {
    const { InitiatePaymentUseCase } = require('../../../payment/application/useCases/InitiatePayment');
    InitiatePaymentUseCase.mockImplementation(() => ({
      execute: jest.fn().mockRejectedValue(new Error('Gateway down')),
    }));

    const { PaymentPaymentAuthorizationAdapter } = require('./PaymentPaymentAuthorizationAdapter');
    const failingAdapter = new PaymentPaymentAuthorizationAdapter(mockPaymentRepo as never);

    await expect(
      failingAdapter.initiatePayment({
        orderId: 'order-1',
        amount: 100,
        currency: 'USD',
        paymentMethodId: 'pm-1',
      }),
    ).rejects.toThrow('Gateway down');
  });
});
