import { GetTransactionUseCase, ListTransactionsUseCase, GetTransactionCommand, ListTransactionsCommand } from './GetTransactions';
import { TransactionIdOrExternalIdRequiredError } from '../../domain/errors/PaymentErrors';

describe('GetTransactionUseCase', () => {
  let useCase: GetTransactionUseCase;
  let mockRepo: Record<string, jest.Mock>;

  const makeTxn = () => ({
    transactionId: 't1', orderId: 'o1', customerId: 'c1', paymentMethodConfigId: 'pm1', gatewayId: 'gw1',
    externalTransactionId: 'ext-1', amount: 100, currency: 'USD', status: 'captured',
    refundedAmount: 0, refundableAmount: 100, isPaid: true, canBeRefunded: true,
    authorizedAt: new Date(), capturedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
  });

  beforeEach(() => {
    mockRepo = {
      findTransactionById: jest.fn().mockResolvedValue(makeTxn()),
      findTransactionByExternalId: jest.fn().mockResolvedValue(null),
    };
    useCase = new GetTransactionUseCase(mockRepo as never);
  });

  it('should get transaction by ID (happy path)', async () => {
    const result = await useCase.execute(new GetTransactionCommand('t1'));

    expect(result).not.toBeNull();
    expect(result!.transactionId).toBe('t1');
  });

  it('should get transaction by external ID', async () => {
    mockRepo.findTransactionById.mockResolvedValue(null);
    mockRepo.findTransactionByExternalId.mockResolvedValue(makeTxn());

    const result = await useCase.execute(new GetTransactionCommand(undefined, 'ext-1'));

    expect(result).not.toBeNull();
    expect(result!.externalTransactionId).toBe('ext-1');
  });

  it('should return null when transaction not found', async () => {
    mockRepo.findTransactionById.mockResolvedValue(null);

    const result = await useCase.execute(new GetTransactionCommand('missing'));

    expect(result).toBeNull();
  });

  it('should throw TransactionIdOrExternalIdRequiredError when neither provided', () => {
    expect(() => new GetTransactionCommand()).toThrow(TransactionIdOrExternalIdRequiredError);
  });
});

describe('ListTransactionsUseCase', () => {
  let useCase: ListTransactionsUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findAllTransactions: jest.fn().mockResolvedValue({
        data: [{
          transactionId: 't1', orderId: 'o1', customerId: 'c1', paymentMethodConfigId: 'pm1', gatewayId: 'gw1',
          amount: 100, currency: 'USD', status: 'captured', refundedAmount: 0, refundableAmount: 100,
          isPaid: true, canBeRefunded: true, createdAt: new Date(), updatedAt: new Date(),
        }],
        total: 1, limit: 50, offset: 0, hasMore: false,
      }),
    };
    useCase = new ListTransactionsUseCase(mockRepo as never);
  });

  it('should list transactions (happy path)', async () => {
    const result = await useCase.execute(new ListTransactionsCommand());

    expect(result.transactions).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('should pass filters to repository', async () => {
    await useCase.execute(new ListTransactionsCommand({ orderId: 'o1', status: 'captured' as never }, 10, 5));

    expect(mockRepo.findAllTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'o1' }),
      expect.objectContaining({ limit: 10, offset: 5 }),
    );
  });
});
