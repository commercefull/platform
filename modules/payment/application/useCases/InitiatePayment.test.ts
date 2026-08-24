jest.mock('../../../../libs/uuid', () => ({
  __esModule: true,
  generateUUID: jest.fn().mockReturnValue('txn-uuid'),
}));

jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { InitiatePaymentUseCase, InitiatePaymentCommand } from './InitiatePayment';
import { AmountMustBePositiveError, NoPaymentGatewayConfiguredError } from '../../domain/errors/PaymentErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('InitiatePaymentUseCase', () => {
  let useCase: InitiatePaymentUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      getDefaultGateway: jest.fn().mockResolvedValue({ gatewayId: 'gw-1', name: 'Stripe' }),
      saveTransaction: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new InitiatePaymentUseCase(mockRepo as never);
  });

  it('should initiate payment (happy path)', async () => {
    const result = await useCase.execute(new InitiatePaymentCommand('o1', 100, 'USD', 'pm-1'));

    expect(result.transactionId).toBe('txn-uuid');
    expect(result.orderId).toBe('o1');
    expect(result.amount).toBe(100);
    expect(eventBus.emit).toHaveBeenCalledWith('payment.received', expect.objectContaining({ transactionId: 'txn-uuid' }));
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
