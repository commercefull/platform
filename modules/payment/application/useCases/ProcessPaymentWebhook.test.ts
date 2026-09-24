import { lazyMock, createPaymentWebhook } from '../../tests/testUtils';
import { ProcessPaymentWebhookUseCase, ProcessPaymentWebhookCommand } from './ProcessPaymentWebhook';
import { FailedToCreatePaymentWebhookError } from '../../domain/errors/PaymentErrors';
import type { PaymentRepository } from '../../domain/repositories/PaymentRepository';

describe('ProcessPaymentWebhookUseCase', () => {
  let useCase: ProcessPaymentWebhookUseCase;
  let repo: jest.Mocked<PaymentRepository>;

  beforeEach(() => {
    repo = lazyMock<PaymentRepository>();
    repo.findWebhookByExternalId.mockResolvedValue(null);
    repo.createWebhook.mockResolvedValue(createPaymentWebhook({ paymentWebhookId: 'w1' }));
    useCase = new ProcessPaymentWebhookUseCase(repo);
  });

  it('should process a new webhook', async () => {
    const result = await useCase.execute(new ProcessPaymentWebhookCommand('ext1', 'stripe', 'payment.succeeded', { id: 'evt_1' }));

    expect(result.paymentWebhookId).toBe('w1');
    expect(result.alreadyExisted).toBe(false);
  });

  it('should return the existing webhook for idempotency', async () => {
    repo.findWebhookByExternalId.mockResolvedValueOnce(createPaymentWebhook({ paymentWebhookId: 'w0' }));

    const result = await useCase.execute(new ProcessPaymentWebhookCommand('ext1', 'stripe', 'payment.succeeded', { id: 'evt_1' }));

    expect(result.paymentWebhookId).toBe('w0');
    expect(result.alreadyExisted).toBe(true);
    expect(repo.createWebhook).not.toHaveBeenCalled();
  });

  it('should throw FailedToCreatePaymentWebhookError when creation fails', async () => {
    repo.createWebhook.mockResolvedValueOnce(null);

    await expect(useCase.execute(new ProcessPaymentWebhookCommand('ext2', 'stripe', 'payment.failed', { id: 'evt_2' }))).rejects.toThrow(
      FailedToCreatePaymentWebhookError,
    );
  });
});
