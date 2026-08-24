/**
 * Unit Tests for CapturePayment Use Case
 */

import { CapturePaymentUseCase } from './CapturePayment';
import {
  TransactionNotFoundError,
  TransactionCannotBeCapturedError,
  CaptureAmountExceedsAuthorizedError,
  CaptureFailedError,
} from '../../domain/errors/PaymentErrors';

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

function createAuthorizedTransaction(overrides: Record<string, unknown> = {}) {
  return {
    transactionId: 'tx-1',
    orderId: 'order-1',
    gatewayTransactionId: 'gw-tx-1',
    amount: 100,
    currency: 'USD',
    status: 'authorized',
    capturedAmount: undefined,
    capturedAt: undefined,
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
    capture: jest.fn().mockResolvedValue({ success, response, error }),
  };
}

describe('CapturePaymentUseCase', () => {
  it('should capture full amount successfully', async () => {
    const tx = createAuthorizedTransaction();
    const repo = createMockRepo(tx);
    const gateway = createMockGateway(true, { id: 'cap-1' });
    const useCase = new CapturePaymentUseCase(repo, gateway);

    const result = await useCase.execute({ transactionId: 'tx-1' });

    expect(result.transactionId).toBe('tx-1');
    expect(result.capturedAmount).toBe(100);
    expect(result.status).toBe('captured');
    expect(result.remainingAmount).toBeUndefined();
    expect(repo.updateTransaction).toHaveBeenCalled();
  });

  it('should capture partial amount successfully', async () => {
    const tx = createAuthorizedTransaction();
    const repo = createMockRepo(tx);
    const gateway = createMockGateway(true, { id: 'cap-2' });
    const useCase = new CapturePaymentUseCase(repo, gateway);

    const result = await useCase.execute({ transactionId: 'tx-1', amount: 40 });

    expect(result.capturedAmount).toBe(40);
    expect(result.status).toBe('partial_captured');
    expect(result.remainingAmount).toBe(60);
  });

  it('should throw TransactionNotFoundError when transaction does not exist', async () => {
    const repo = createMockRepo(null);
    const gateway = createMockGateway(true);
    const useCase = new CapturePaymentUseCase(repo, gateway);

    await expect(
      useCase.execute({ transactionId: 'nonexistent' }),
    ).rejects.toThrow(TransactionNotFoundError);
  });

  it('should throw TransactionCannotBeCapturedError when status is not authorized', async () => {
    const tx = createAuthorizedTransaction({ status: 'pending' });
    const repo = createMockRepo(tx);
    const gateway = createMockGateway(true);
    const useCase = new CapturePaymentUseCase(repo, gateway);

    await expect(
      useCase.execute({ transactionId: 'tx-1' }),
    ).rejects.toThrow(TransactionCannotBeCapturedError);
  });

  it('should throw CaptureAmountExceedsAuthorizedError when amount exceeds authorized', async () => {
    const tx = createAuthorizedTransaction();
    const repo = createMockRepo(tx);
    const gateway = createMockGateway(true);
    const useCase = new CapturePaymentUseCase(repo, gateway);

    await expect(
      useCase.execute({ transactionId: 'tx-1', amount: 150 }),
    ).rejects.toThrow(CaptureAmountExceedsAuthorizedError);
  });

  it('should throw CaptureFailedError when gateway returns failure', async () => {
    const tx = createAuthorizedTransaction();
    const repo = createMockRepo(tx);
    const gateway = createMockGateway(false, undefined, 'Gateway declined');
    const useCase = new CapturePaymentUseCase(repo, gateway);

    await expect(
      useCase.execute({ transactionId: 'tx-1' }),
    ).rejects.toThrow(CaptureFailedError);

    expect(repo.updateTransaction).toHaveBeenCalled();
  });
});
