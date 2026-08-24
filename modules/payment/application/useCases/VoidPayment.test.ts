/**
 * Unit Tests for VoidPayment Use Case
 */

import { VoidPaymentUseCase } from './VoidPayment';
import {
  TransactionNotFoundError,
  TransactionCannotBeVoidedError,
  VoidFailedError,
} from '../../domain/errors/PaymentErrors';

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

function createAuthorizedTransaction(overrides: Record<string, unknown> = {}) {
  return {
    transactionId: 'tx-1',
    orderId: 'order-1',
    gatewayTransactionId: 'gw-tx-1',
    status: 'authorized',
    voidedAt: undefined,
    voidReason: undefined,
    gatewayResponse: undefined,
    ...overrides,
  };
}

function createMockRepo(tx: ReturnType<typeof createAuthorizedTransaction> | null) {
  return {
    findTransactionById: jest.fn().mockResolvedValue(tx),
    updateTransaction: jest.fn().mockResolvedValue(undefined),
  };
}

function createMockGateway(success: boolean, response?: Record<string, unknown>, error?: string) {
  return {
    void: jest.fn().mockResolvedValue({ success, response, error }),
  };
}

describe('VoidPaymentUseCase', () => {
  it('should void an authorized transaction successfully', async () => {
    const tx = createAuthorizedTransaction();
    const repo = createMockRepo(tx);
    const gateway = createMockGateway(true, { id: 'void-1' });
    const useCase = new VoidPaymentUseCase(repo, gateway);

    const result = await useCase.execute({ transactionId: 'tx-1', reason: 'customer request' });

    expect(result.transactionId).toBe('tx-1');
    expect(result.status).toBe('voided');
    expect(result.voidedAt).toBeDefined();
    expect(repo.updateTransaction).toHaveBeenCalled();
  });

  it('should throw TransactionNotFoundError when transaction does not exist', async () => {
    const repo = createMockRepo(null);
    const gateway = createMockGateway(true);
    const useCase = new VoidPaymentUseCase(repo, gateway);

    await expect(
      useCase.execute({ transactionId: 'nonexistent' }),
    ).rejects.toThrow(TransactionNotFoundError);
  });

  it('should throw TransactionCannotBeVoidedError when status is not authorized', async () => {
    const tx = createAuthorizedTransaction({ status: 'captured' });
    const repo = createMockRepo(tx);
    const gateway = createMockGateway(true);
    const useCase = new VoidPaymentUseCase(repo, gateway);

    await expect(
      useCase.execute({ transactionId: 'tx-1' }),
    ).rejects.toThrow(TransactionCannotBeVoidedError);
  });

  it('should throw VoidFailedError when gateway returns failure', async () => {
    const tx = createAuthorizedTransaction();
    const repo = createMockRepo(tx);
    const gateway = createMockGateway(false, undefined, 'Gateway error');
    const useCase = new VoidPaymentUseCase(repo, gateway);

    await expect(
      useCase.execute({ transactionId: 'tx-1' }),
    ).rejects.toThrow(VoidFailedError);

    expect(repo.updateTransaction).toHaveBeenCalled();
  });
});
