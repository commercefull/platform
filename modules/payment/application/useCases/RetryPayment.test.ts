/**
 * Unit Tests for RetryPayment Use Case
 */

import { RetryPaymentUseCase } from './RetryPayment';
import {
  TransactionNotFoundError,
  CannotRetryTransactionError,
  MaxRetryAttemptsReachedError,
} from '../../domain/errors/PaymentErrors';

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

function createFailedTransaction(overrides: Record<string, unknown> = {}) {
  return {
    transactionId: 'tx-1',
    orderId: 'order-1',
    customerId: 'cust-1',
    amount: 100,
    currency: 'USD',
    paymentMethodId: 'pm-1',
    provider: 'stripe',
    status: 'failed',
    metadata: {},
    ...overrides,
  };
}

function createMockRepo(
  tx: ReturnType<typeof createFailedTransaction> | null,
  retryCount = 0,
) {
  return {
    findById: jest.fn().mockResolvedValue(tx),
    countRetries: jest.fn().mockResolvedValue(retryCount),
    create: jest.fn().mockResolvedValue(createFailedTransaction({ status: 'pending' })),
    updateStatus: jest.fn().mockResolvedValue(undefined),
  };
}

describe('RetryPaymentUseCase', () => {
  it('should retry a failed payment successfully', async () => {
    const tx = createFailedTransaction();
    const repo = createMockRepo(tx, 0);
    const useCase = new RetryPaymentUseCase(repo);

    const result = await useCase.execute({ transactionId: 'tx-1' });

    expect(result.success).toBe(true);
    expect(result.status).toBe('completed');
    expect(result.newTransactionId).toBeDefined();
    expect(repo.create).toHaveBeenCalled();
    expect(repo.updateStatus).toHaveBeenCalledWith(
      expect.any(String),
      'completed',
      expect.objectContaining({ providerTransactionId: expect.any(String) }),
    );
  });

  it('should throw TransactionNotFoundError when transaction does not exist', async () => {
    const repo = createMockRepo(null);
    const useCase = new RetryPaymentUseCase(repo);

    await expect(
      useCase.execute({ transactionId: 'nonexistent' }),
    ).rejects.toThrow(TransactionNotFoundError);
  });

  it('should throw CannotRetryTransactionError when status is not failed', async () => {
    const tx = createFailedTransaction({ status: 'completed' });
    const repo = createMockRepo(tx);
    const useCase = new RetryPaymentUseCase(repo);

    await expect(
      useCase.execute({ transactionId: 'tx-1' }),
    ).rejects.toThrow(CannotRetryTransactionError);
  });

  it('should throw MaxRetryAttemptsReachedError when retry count is 3', async () => {
    const tx = createFailedTransaction();
    const repo = createMockRepo(tx, 3);
    const useCase = new RetryPaymentUseCase(repo);

    await expect(
      useCase.execute({ transactionId: 'tx-1' }),
    ).rejects.toThrow(MaxRetryAttemptsReachedError);
  });

  it('should use provided paymentMethodId when specified', async () => {
    const tx = createFailedTransaction();
    const repo = createMockRepo(tx, 0);
    const useCase = new RetryPaymentUseCase(repo);

    await useCase.execute({ transactionId: 'tx-1', paymentMethodId: 'pm-new' });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethodId: 'pm-new' }),
    );
  });
});
