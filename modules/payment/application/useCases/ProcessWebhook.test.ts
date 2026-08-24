jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

import { ProcessWebhookUseCase } from './ProcessWebhook';
import { InvalidWebhookSignatureError } from '../../domain/errors/PaymentErrors';

const mockPaymentRepo = {
  findByProviderTransactionId: jest.fn().mockResolvedValue({
    transactionId: 't1', orderId: 'o1', amount: 100,
  }),
  updateStatus: jest.fn().mockResolvedValue(undefined),
  findRefundByProviderRefundId: jest.fn().mockResolvedValue(null),
  updateRefundStatus: jest.fn().mockResolvedValue(undefined),
  createDispute: jest.fn().mockResolvedValue(undefined),
};

describe('ProcessWebhookUseCase', () => {
  let useCase: ProcessWebhookUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ProcessWebhookUseCase(mockPaymentRepo as never, {});
  });

  it('should process payment completed webhook', async () => {
    const result = await useCase.execute({
      provider: 'stripe',
      eventType: 'payment_intent.succeeded',
      payload: { data: { object: { id: 'pi_1' } } },
    });

    expect(result.processed).toBe(true);
    expect(result.action).toBe('payment_completed');
    expect(result.transactionId).toBe('t1');
  });

  it('should process payment failed webhook', async () => {
    const result = await useCase.execute({
      provider: 'stripe',
      eventType: 'payment_intent.payment_failed',
      payload: { data: { object: { id: 'pi_1' } } },
    });

    expect(result.processed).toBe(true);
    expect(result.action).toBe('payment_failed');
  });

  it('should throw InvalidWebhookSignatureError for bad signature', async () => {
    await expect(useCase.execute({
      provider: 'stripe',
      eventType: 'payment_intent.succeeded',
      payload: {},
      signature: 'bad_sig',
    })).rejects.toThrow(InvalidWebhookSignatureError);
  });

  it('should handle unknown event type', async () => {
    const result = await useCase.execute({
      provider: 'stripe',
      eventType: 'unknown.event',
      payload: {},
    });

    expect(result.processed).toBe(true);
    expect(result.action).toBeUndefined();
  });
});
