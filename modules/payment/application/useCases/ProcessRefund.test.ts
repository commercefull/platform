jest.mock('../../../../libs/uuid', () => ({
  __esModule: true,
  generateUUID: jest.fn().mockReturnValue('refund-uuid'),
}));

jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../../libs/db', () => ({
  __esModule: true,
  withTransaction: jest.fn((cb: () => Promise<unknown>) => cb()),
}));

import { ProcessPaymentRefundUseCase, ProcessPaymentRefundCommand } from './ProcessRefund';
import { TransactionNotFoundError, TransactionCannotBeRefundedError, RefundAmountExceedsRefundableError } from '../../domain/errors/PaymentErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('ProcessPaymentRefundUseCase', () => {
  let useCase: ProcessPaymentRefundUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockTxn: Record<string, unknown>;

  beforeEach(() => {
    mockTxn = {
      transactionId: 't1', status: 'captured', currency: 'USD', refundableAmount: 100,
      canBeRefunded: true, recordRefund: jest.fn(),
    };
    mockRepo = {
      findTransactionById: jest.fn().mockResolvedValue(mockTxn),
      saveRefund: jest.fn().mockResolvedValue(undefined),
      saveTransaction: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ProcessPaymentRefundUseCase(mockRepo as never);
  });

  it('should process refund (happy path)', async () => {
    const result = await useCase.execute(new ProcessPaymentRefundCommand('t1', 50, 'Customer request'));

    expect(result.refundId).toBe('refund-uuid');
    expect(result.amount).toBe(50);
    expect(mockTxn.recordRefund).toHaveBeenCalledWith(50);
    expect(eventBus.emit).toHaveBeenCalled();
  });

  it('should throw TransactionNotFoundError when transaction does not exist', async () => {
    mockRepo.findTransactionById.mockResolvedValue(null);

    await expect(useCase.execute(new ProcessPaymentRefundCommand('missing', 50))).rejects.toThrow(TransactionNotFoundError);
  });

  it('should throw TransactionCannotBeRefundedError when transaction cannot be refunded', async () => {
    mockTxn.canBeRefunded = false;

    await expect(useCase.execute(new ProcessPaymentRefundCommand('t1', 50))).rejects.toThrow(TransactionCannotBeRefundedError);
  });

  it('should throw RefundAmountExceedsRefundableError when amount exceeds refundable', async () => {
    await expect(useCase.execute(new ProcessPaymentRefundCommand('t1', 200))).rejects.toThrow(RefundAmountExceedsRefundableError);
  });
});
