import { ListTransactionsUseCase, ListTransactionsCommand } from './ListTransactions';
import { TransactionStatus } from '../../domain/valueObjects/PaymentStatus';
import type { PaymentRepository } from '../../domain/repositories/PaymentRepository';
import { PaymentTransaction } from '../../domain/entities/PaymentTransaction';

describe('ListTransactionsUseCase', () => {
  let useCase: ListTransactionsUseCase;
  let mockRepo: jest.Mocked<Pick<PaymentRepository, 'findAllTransactions'>>;

  const makeTxn = (): PaymentTransaction => {
    const txn = PaymentTransaction.create({
      transactionId: 't1',
      orderId: 'o1',
      customerId: 'c1',
      paymentMethodConfigId: 'pm1',
      gatewayId: 'gw1',
      amountCents: 100,
      currency: 'USD',
    });
    txn.markAsPaid('ext-1');
    return txn;
  };

  beforeEach(() => {
    mockRepo = {
      findAllTransactions: jest.fn().mockResolvedValue({
        data: [makeTxn()],
        total: 1,
        limit: 50,
        offset: 0,
        hasMore: false,
        length: 1,
      }),
    };
    useCase = new ListTransactionsUseCase(mockRepo as unknown as PaymentRepository);
  });

  it('should list transactions (happy path)', async () => {
    const result = await useCase.execute(new ListTransactionsCommand());

    expect(result.transactions).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('should pass filters to repository', async () => {
    await useCase.execute(new ListTransactionsCommand({ orderId: 'o1', status: TransactionStatus.PAID }, 10, 5));

    expect(mockRepo.findAllTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'o1' }),
      expect.objectContaining({ limit: 10, offset: 5 }),
    );
  });
});
