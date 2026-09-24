import { GetTransactionUseCase, GetTransactionCommand } from './GetTransaction';
import { TransactionIdOrExternalIdRequiredError } from '../../domain/errors/PaymentErrors';
import type { PaymentRepository } from '../../domain/repositories/PaymentRepository';
import { PaymentTransaction } from '../../domain/entities/PaymentTransaction';

describe('GetTransactionUseCase', () => {
  let useCase: GetTransactionUseCase;
  let mockRepo: jest.Mocked<Pick<PaymentRepository, 'findTransactionById' | 'findTransactionByExternalId'>>;

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
      findTransactionById: jest.fn().mockResolvedValue(makeTxn()),
      findTransactionByExternalId: jest.fn().mockResolvedValue(null),
    };
    useCase = new GetTransactionUseCase(mockRepo as unknown as PaymentRepository);
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

