/**
 * Tests for PaymentDelegatedPaymentAdapter — translates the channel's
 * delegated-charge request into payment's ChargeDelegatedPayment command.
 */

import {
  ChargeDelegatedPaymentCommand,
  type ChargeDelegatedPaymentUseCase,
} from '../../../payment/application/useCases/ChargeDelegatedPayment';
import { PaymentDelegatedPaymentAdapter } from './PaymentDelegatedPaymentAdapter';

describe('PaymentDelegatedPaymentAdapter', () => {
  const useCase = {
    execute: jest.fn(async (_cmd: ChargeDelegatedPaymentCommand) => ({
      externalTransactionId: 'pi_123',
      provider: 'stripe',
      status: 'paid' as const,
    })),
  };
  const adapter = new PaymentDelegatedPaymentAdapter(useCase as unknown as Pick<ChargeDelegatedPaymentUseCase, 'execute'>);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should map the charge request onto a ChargeDelegatedPaymentCommand', async () => {
    await adapter.chargeDelegatedPayment({
      organizationId: 'org-1',
      orderId: 'order-1',
      transactionId: 'txn-1',
      amountCents: 4818,
      currency: 'USD',
      credential: { provider: 'stripe', credentialType: 'spt', token: 'spt_token_123' },
      customerId: 'cust-1',
      customerEmail: 'buyer@example.com',
    });

    const command = useCase.execute.mock.calls[0][0] as ChargeDelegatedPaymentCommand;
    expect(command).toBeInstanceOf(ChargeDelegatedPaymentCommand);
    expect(command).toMatchObject({
      organizationId: 'org-1',
      orderId: 'order-1',
      transactionId: 'txn-1',
      amountCents: 4818,
      currency: 'USD',
      credential: { provider: 'stripe', credentialType: 'spt', token: 'spt_token_123' },
      customerId: 'cust-1',
      customerEmail: 'buyer@example.com',
    });
  });

  it('should map the use-case response to a DelegatedChargeResult', async () => {
    const result = await adapter.chargeDelegatedPayment({
      organizationId: 'org-1',
      orderId: 'order-1',
      transactionId: 'txn-1',
      amountCents: 100,
      currency: 'USD',
      credential: { provider: 'stripe', credentialType: 'spt', token: 'spt_token_123' },
    });

    expect(result).toEqual({ externalTransactionId: 'pi_123', provider: 'stripe', status: 'paid' });
  });
});
