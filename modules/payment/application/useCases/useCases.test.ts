/**
 * Unit Tests for Payment Use Cases
 */

import { ProcessPaymentRefundCommand, ProcessPaymentRefundUseCase } from './ProcessRefund';
import { InitiatePaymentCommand, InitiatePaymentUseCase } from './InitiatePayment';
import { PaymentTransaction } from '../../domain/entities/PaymentTransaction';
import { TransactionStatus } from '../../domain/valueObjects/PaymentStatus';
import {
  TransactionNotFoundError,
  TransactionCannotBeRefundedError,
  RefundAmountExceedsRefundableError,
  AmountMustBePositiveError,
  NoPaymentGatewayConfiguredError,
} from '../../domain/errors/PaymentErrors';

import type { PaymentRepository } from '../../domain/repositories/PaymentRepository';

// Mock withTransaction to just execute the callback
jest.mock('../../../../libs/db', () => ({
  withTransaction: jest.fn((fn: () => Promise<unknown>) => fn()),
}));

// Mock eventBus
jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

function createMockPaymentRepo(
  tx: PaymentTransaction | null,
  gateway: { gatewayId: string } | null = { gatewayId: 'gw-1' },
): jest.Mocked<PaymentRepository> {
  return {
    findTransactionById: jest.fn().mockResolvedValue(tx),
    saveTransaction: jest.fn().mockResolvedValue(tx),
    saveRefund: jest.fn().mockResolvedValue(undefined),
    getDefaultGateway: jest.fn().mockResolvedValue(gateway),
  } as never as jest.Mocked<PaymentRepository>;
}

function createPaidTransaction(): PaymentTransaction {
  const tx = PaymentTransaction.create({
    transactionId: 'tx-1',
    orderId: 'order-1',
    paymentMethodConfigId: 'pmc-1',
    gatewayId: 'gw-1',
    amount: 100,
    currency: 'USD',
  });
  tx.markAsPaid('ext-123');
  return tx;
}

describe('ProcessPaymentRefundUseCase', () => {
  it('should process a partial refund', async () => {
    const tx = createPaidTransaction();
    const repo = createMockPaymentRepo(tx);
    const useCase = new ProcessPaymentRefundUseCase(repo);

    const result = await useCase.execute(
      new ProcessPaymentRefundCommand('tx-1', 30, 'partial refund'),
    );

    expect(result.amount).toBe(30);
    expect(result.transactionId).toBe('tx-1');
    expect(repo.saveRefund).toHaveBeenCalled();
    expect(repo.saveTransaction).toHaveBeenCalled();
  });

  it('should process a full refund', async () => {
    const tx = createPaidTransaction();
    const repo = createMockPaymentRepo(tx);
    const useCase = new ProcessPaymentRefundUseCase(repo);

    const result = await useCase.execute(
      new ProcessPaymentRefundCommand('tx-1', 100, 'full refund'),
    );

    expect(result.amount).toBe(100);
  });

  it('should throw TransactionNotFoundError when transaction does not exist', async () => {
    const repo = createMockPaymentRepo(null);
    const useCase = new ProcessPaymentRefundUseCase(repo);

    await expect(
      useCase.execute(new ProcessPaymentRefundCommand('nonexistent', 50, 'reason')),
    ).rejects.toThrow(TransactionNotFoundError);
  });

  it('should throw TransactionCannotBeRefundedError when transaction is PENDING', async () => {
    const tx = PaymentTransaction.create({
      transactionId: 'tx-1',
      orderId: 'order-1',
      paymentMethodConfigId: 'pmc-1',
      gatewayId: 'gw-1',
      amount: 100,
      currency: 'USD',
    });
    const repo = createMockPaymentRepo(tx);
    const useCase = new ProcessPaymentRefundUseCase(repo);

    await expect(
      useCase.execute(new ProcessPaymentRefundCommand('tx-1', 50, 'reason')),
    ).rejects.toThrow(TransactionCannotBeRefundedError);
  });

  it('should throw RefundAmountExceedsRefundableError when amount exceeds refundable', async () => {
    const tx = createPaidTransaction();
    const repo = createMockPaymentRepo(tx);
    const useCase = new ProcessPaymentRefundUseCase(repo);

    await expect(
      useCase.execute(new ProcessPaymentRefundCommand('tx-1', 150, 'reason')),
    ).rejects.toThrow(RefundAmountExceedsRefundableError);
  });
});

describe('InitiatePaymentUseCase', () => {
  it('should initiate a payment and return a pending transaction', async () => {
    const tx = PaymentTransaction.create({
      transactionId: 'tx-new',
      orderId: 'order-1',
      paymentMethodConfigId: 'pmc-1',
      gatewayId: 'gw-1',
      amount: 100,
      currency: 'USD',
    });
    const repo = createMockPaymentRepo(tx);
    const useCase = new InitiatePaymentUseCase(repo);

    const result = await useCase.execute(
      new InitiatePaymentCommand('order-1', 100, 'USD', 'pmc-1', 'cust-1', '127.0.0.1'),
    );

    expect(result.amount).toBe(100);
    expect(result.status).toBe(TransactionStatus.PENDING);
    expect(repo.saveTransaction).toHaveBeenCalled();
  });

  it('should throw AmountMustBePositiveError for zero amount', async () => {
    const repo = createMockPaymentRepo(null);
    const useCase = new InitiatePaymentUseCase(repo);

    await expect(
      useCase.execute(new InitiatePaymentCommand('order-1', 0, 'USD', 'pmc-1')),
    ).rejects.toThrow(AmountMustBePositiveError);
  });

  it('should throw NoPaymentGatewayConfiguredError when no gateway', async () => {
    const repo = createMockPaymentRepo(null, null);
    const useCase = new InitiatePaymentUseCase(repo);

    await expect(
      useCase.execute(new InitiatePaymentCommand('order-1', 100, 'USD', 'pmc-1')),
    ).rejects.toThrow(NoPaymentGatewayConfiguredError);
  });
});
