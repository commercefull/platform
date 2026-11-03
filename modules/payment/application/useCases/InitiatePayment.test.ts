import { emitMock, uuidMock } from '../../tests/testUtils';
import { InitiatePaymentUseCase, InitiatePaymentCommand } from './InitiatePayment';
import { AmountMustBePositiveError, NoPaymentGatewayConfiguredError } from '../../domain/errors/PaymentErrors';
import type { PaymentTransactionRepository } from '../../domain/repositories/PaymentTransactionRepository';
import type { PaymentGatewayConfigRepository } from '../../domain/repositories/PaymentGatewayConfigRepository';
import type { PaymentTransaction } from '../../domain/entities/PaymentTransaction';

beforeEach(() => {
  uuidMock.mockReturnValue('txn-uuid');
  emitMock.mockClear();
});

describe('InitiatePaymentUseCase', () => {
  let useCase: InitiatePaymentUseCase;
  let mockRepo: jest.Mocked<
    Pick<PaymentTransactionRepository, 'saveTransaction' | 'findTransactionsByOrderId'> &
      Pick<PaymentGatewayConfigRepository, 'getDefaultGateway'>
  >;

  beforeEach(() => {
    mockRepo = {
      getDefaultGateway: jest.fn().mockResolvedValue({ gatewayId: 'gw-1', provider: 'stripe', isTestMode: true }),
      saveTransaction: jest.fn().mockResolvedValue(undefined as unknown as PaymentTransaction),
      findTransactionsByOrderId: jest.fn().mockResolvedValue([]),
    };
    useCase = new InitiatePaymentUseCase(mockRepo, mockRepo);
  });

  it('should initiate payment (happy path)', async () => {
    const result = await useCase.execute(
      new InitiatePaymentCommand({ orderId: 'o1', amountCents: 100, currency: 'USD', paymentMethodConfigId: 'pm-1' }),
    );

    expect(result.transactionId).toBe('txn-uuid');
    expect(result.orderId).toBe('o1');
    expect(result.amountCents).toBe(100);
    expect(emitMock).toHaveBeenCalledWith('payment.received', expect.objectContaining({ transactionId: 'txn-uuid' }));
  });

  it('should throw AmountMustBePositiveError for zero amountCents', async () => {
    await expect(
      useCase.execute(new InitiatePaymentCommand({ orderId: 'o1', amountCents: 0, currency: 'USD', paymentMethodConfigId: 'pm-1' })),
    ).rejects.toThrow(AmountMustBePositiveError);
  });

  it('should throw AmountMustBePositiveError for negative amountCents', async () => {
    await expect(
      useCase.execute(new InitiatePaymentCommand({ orderId: 'o1', amountCents: -10, currency: 'USD', paymentMethodConfigId: 'pm-1' })),
    ).rejects.toThrow(AmountMustBePositiveError);
  });

  it('should throw NoPaymentGatewayConfiguredError when no gateway', async () => {
    mockRepo.getDefaultGateway.mockResolvedValue(null);

    await expect(
      useCase.execute(new InitiatePaymentCommand({ orderId: 'o1', amountCents: 100, currency: 'USD', paymentMethodConfigId: 'pm-1' })),
    ).rejects.toThrow(NoPaymentGatewayConfiguredError);
  });

  it('should return the existing transaction without creating a new one when a live intent exists for the order', async () => {
    mockRepo.findTransactionsByOrderId.mockResolvedValue([
      {
        transactionId: 'txn-existing',
        orderId: 'o1',
        amountCents: 100,
        currency: 'USD',
        status: 'pending',
        createdAt: new Date('2026-01-01'),
      } as unknown as PaymentTransaction,
    ]);

    const result = await useCase.execute(
      new InitiatePaymentCommand({ orderId: 'o1', amountCents: 100, currency: 'USD', paymentMethodConfigId: 'pm-1' }),
    );

    expect(result.transactionId).toBe('txn-existing');
    expect(mockRepo.saveTransaction).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalledWith('payment.received', expect.anything());
  });

  it('should create a new transaction when prior transactions for the order all failed', async () => {
    mockRepo.findTransactionsByOrderId.mockResolvedValue([
      {
        transactionId: 'txn-failed',
        orderId: 'o1',
        status: 'failed',
      } as unknown as PaymentTransaction,
    ]);

    const result = await useCase.execute(
      new InitiatePaymentCommand({ orderId: 'o1', amountCents: 100, currency: 'USD', paymentMethodConfigId: 'pm-1' }),
    );

    expect(result.transactionId).toBe('txn-uuid');
    expect(mockRepo.saveTransaction).toHaveBeenCalled();
  });
});
