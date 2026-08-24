jest.mock('../../infrastructure/repositories/PaymentDataRepository', () => ({
  __esModule: true,
  default: {
    payments: {
      findWebhookByExternalId: jest.fn().mockResolvedValue(null),
      createWebhook: jest.fn().mockResolvedValue({
        paymentWebhookId: 'w1', externalId: 'ext1', provider: 'stripe',
        eventType: 'payment.succeeded', processedAt: new Date('2026-01-01'),
        createdAt: new Date('2026-01-01'),
      }),
    },
  },
}));

import { ProcessPaymentWebhookUseCase, ProcessPaymentWebhookCommand } from './ProcessPaymentWebhook';
import { FailedToCreatePaymentWebhookError } from '../../domain/errors/PaymentErrors';
import paymentDataRepository from '../../infrastructure/repositories/PaymentDataRepository';

const mockRepo = paymentDataRepository as unknown as { payments: Record<string, jest.Mock> };

describe('ProcessPaymentWebhookUseCase', () => {
  let useCase: ProcessPaymentWebhookUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ProcessPaymentWebhookUseCase();
  });

  it('should process new webhook (happy path)', async () => {
    const result = await useCase.execute(new ProcessPaymentWebhookCommand(
      'ext1', 'stripe', 'payment.succeeded', { id: 'evt_1' },
    ));

    expect(result.paymentWebhookId).toBe('w1');
    expect(result.alreadyExisted).toBe(false);
  });

  it('should return existing webhook (idempotency)', async () => {
    mockRepo.payments.findWebhookByExternalId.mockResolvedValueOnce({
      paymentWebhookId: 'w0', externalId: 'ext1', provider: 'stripe',
      eventType: 'payment.succeeded', createdAt: new Date('2026-01-01'),
    });

    const result = await useCase.execute(new ProcessPaymentWebhookCommand(
      'ext1', 'stripe', 'payment.succeeded', { id: 'evt_1' },
    ));

    expect(result.paymentWebhookId).toBe('w0');
    expect(result.alreadyExisted).toBe(true);
  });

  it('should throw FailedToCreatePaymentWebhookError when creation fails', async () => {
    mockRepo.payments.createWebhook.mockResolvedValueOnce(null);

    await expect(useCase.execute(new ProcessPaymentWebhookCommand(
      'ext2', 'stripe', 'payment.failed', { id: 'evt_2' },
    ))).rejects.toThrow(FailedToCreatePaymentWebhookError);
  });
});
