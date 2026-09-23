import { emitMock, uuidMock } from '../../tests/testUtils';
import { ProcessPaymentRefundUseCase, ProcessPaymentRefundCommand } from './ProcessRefund';
import {
  TransactionNotFoundError,
  TransactionCannotBeRefundedError,
  RefundAmountExceedsRefundableError,
} from '../../domain/errors/PaymentErrors';
import type { PaymentRepository } from '../../domain/repositories/PaymentRepository';
import { PaymentTransaction } from '../../domain/entities/PaymentTransaction';
import type { PaymentRefund } from '../../domain/entities/PaymentRefund';

beforeEach(() => {
    uuidMock.mockReturnValue('refund-uuid');
  emitMock.mockClear();
});

describe('ProcessPaymentRefundUseCase', () => {
  let useCase: ProcessPaymentRefundUseCase;
  let mockRepo: jest.Mocked<Pick<PaymentRepository, 'findTransactionById' | 'saveRefund' | 'saveTransaction'>>;
  let txn: PaymentTransaction;
  let recordRefundSpy: jest.SpyInstance;

  const paidTxn = (): PaymentTransaction => {
    const t = PaymentTransaction.create({
      transactionId: 't1',
      orderId: 'o1',
      paymentMethodConfigId: 'pm1',
      gatewayId: 'gw1',
      amount: 100,
      currency: 'USD',
    });
    t.markAsPaid('ext-1');
    return t;
  };

  beforeEach(() => {
    txn = paidTxn();
    recordRefundSpy = jest.spyOn(txn, 'recordRefund');
    mockRepo = {
      findTransactionById: jest.fn().mockResolvedValue(txn),
      saveRefund: jest.fn().mockResolvedValue(undefined as unknown as PaymentRefund),
      saveTransaction: jest.fn().mockResolvedValue(undefined as unknown as PaymentTransaction),
    };
    useCase = new ProcessPaymentRefundUseCase(mockRepo as unknown as PaymentRepository);
  });

  it('should process refund (happy path)', async () => {
    const result = await useCase.execute(new ProcessPaymentRefundCommand('t1', 50, 'Customer request'));

    expect(result.refundId).toBe('refund-uuid');
    expect(result.amount).toBe(50);
    expect(recordRefundSpy).toHaveBeenCalledWith(50);
    expect(emitMock).toHaveBeenCalled();
  });

  it('should process a full refund up to the refundable amount', async () => {
    const result = await useCase.execute(new ProcessPaymentRefundCommand('t1', 100, 'full refund'));

    expect(result.amount).toBe(100);
    expect(mockRepo.saveRefund).toHaveBeenCalled();
    expect(mockRepo.saveTransaction).toHaveBeenCalled();
  });

  it('should throw TransactionNotFoundError when transaction does not exist', async () => {
    mockRepo.findTransactionById.mockResolvedValue(null);

    await expect(useCase.execute(new ProcessPaymentRefundCommand('missing', 50))).rejects.toThrow(TransactionNotFoundError);
  });

  it('should throw TransactionCannotBeRefundedError when transaction cannot be refunded', async () => {
    mockRepo.findTransactionById.mockResolvedValue(
      PaymentTransaction.create({ transactionId: 't2', orderId: 'o1', paymentMethodConfigId: 'pm1', gatewayId: 'gw1', amount: 100, currency: 'USD' }),
    );

    await expect(useCase.execute(new ProcessPaymentRefundCommand('t1', 50))).rejects.toThrow(TransactionCannotBeRefundedError);
  });

  it('should throw RefundAmountExceedsRefundableError when amount exceeds refundable', async () => {
    await expect(useCase.execute(new ProcessPaymentRefundCommand('t1', 200))).rejects.toThrow(RefundAmountExceedsRefundableError);
  });
});
