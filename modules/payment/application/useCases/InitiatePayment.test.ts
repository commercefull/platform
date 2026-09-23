import { emitMock, uuidMock } from '../../tests/testUtils';
import { InitiatePaymentUseCase, InitiatePaymentCommand } from './InitiatePayment';
import { AmountMustBePositiveError, NoPaymentGatewayConfiguredError } from '../../domain/errors/PaymentErrors';
import type { PaymentRepository } from '../../domain/repositories/PaymentRepository';
import type { PaymentTransaction } from '../../domain/entities/PaymentTransaction';

beforeEach(() => {
    uuidMock.mockReturnValue('txn-uuid');
  emitMock.mockClear();
});

describe('InitiatePaymentUseCase', () => {
  let useCase: InitiatePaymentUseCase;
  let mockRepo: jest.Mocked<Pick<PaymentRepository, 'getDefaultGateway' | 'saveTransaction'>>;

  beforeEach(() => {
    mockRepo = {
      getDefaultGateway: jest.fn().mockResolvedValue({ gatewayId: 'gw-1', provider: 'stripe', isTestMode: true }),
      saveTransaction: jest.fn().mockResolvedValue(undefined as unknown as PaymentTransaction),
    };
    useCase = new InitiatePaymentUseCase(mockRepo as unknown as PaymentRepository);
  });

  it('should initiate payment (happy path)', async () => {
    const result = await useCase.execute(new InitiatePaymentCommand('o1', 100, 'USD', 'pm-1'));

    expect(result.transactionId).toBe('txn-uuid');
    expect(result.orderId).toBe('o1');
    expect(result.amount).toBe(100);
    expect(emitMock).toHaveBeenCalledWith('payment.received', expect.objectContaining({ transactionId: 'txn-uuid' }));
  });

  it('should throw AmountMustBePositiveError for zero amount', async () => {
    await expect(useCase.execute(new InitiatePaymentCommand('o1', 0, 'USD', 'pm-1'))).rejects.toThrow(AmountMustBePositiveError);
  });

  it('should throw AmountMustBePositiveError for negative amount', async () => {
    await expect(useCase.execute(new InitiatePaymentCommand('o1', -10, 'USD', 'pm-1'))).rejects.toThrow(AmountMustBePositiveError);
  });

  it('should throw NoPaymentGatewayConfiguredError when no gateway', async () => {
    mockRepo.getDefaultGateway.mockResolvedValue(null);

    await expect(useCase.execute(new InitiatePaymentCommand('o1', 100, 'USD', 'pm-1'))).rejects.toThrow(NoPaymentGatewayConfiguredError);
  });
});
