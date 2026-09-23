import { createWebhookRepository } from '../../tests/testUtils';
import { RegisterWebhookUseCase } from './RegisterWebhook';
import { WebhookValidationError } from '../../domain/errors/WebhookErrors';

describe('RegisterWebhookUseCase', () => {
  it('should register the endpoint when the input is valid', async () => {
    const repository = createWebhookRepository();

    const result = await new RegisterWebhookUseCase(repository).execute({
      name: 'Test',
      url: 'https://example.com/hook',
      events: ['product.created'],
    });

    expect(result.webhookEndpointId).toBe('test-uuid');
    expect(result.secret).toBeTruthy();
    expect(result.endpoint).toMatchObject({ name: 'Test', url: 'https://example.com/hook', isActive: true });
    expect(repository.createEndpoint).toHaveBeenCalledWith(
      expect.objectContaining({ webhookEndpointId: 'test-uuid', url: 'https://example.com/hook', events: ['product.created'] }),
    );
  });

  it('should generate a secret for the endpoint when registering', async () => {
    const result = await new RegisterWebhookUseCase(createWebhookRepository()).execute({
      name: 'Test',
      url: 'https://example.com/hook',
      events: ['e'],
    });

    expect(result.secret).toHaveLength(64);
  });

  it('should throw WebhookValidationError when the url is not http', async () => {
    const repository = createWebhookRepository();

    await expect(
      new RegisterWebhookUseCase(repository).execute({ name: 'T', url: 'ftp://bad', events: ['e'] }),
    ).rejects.toThrow(WebhookValidationError);
    expect(repository.createEndpoint).not.toHaveBeenCalled();
  });

  it('should throw WebhookValidationError when no events are specified', async () => {
    const repository = createWebhookRepository();

    await expect(
      new RegisterWebhookUseCase(repository).execute({ name: 'T', url: 'https://ok.com', events: [] }),
    ).rejects.toThrow(WebhookValidationError);
    expect(repository.createEndpoint).not.toHaveBeenCalled();
  });

  it('should throw WebhookValidationError when the name is missing', async () => {
    const repository = createWebhookRepository();

    await expect(
      new RegisterWebhookUseCase(repository).execute({ name: '', url: 'https://ok.com', events: ['e'] }),
    ).rejects.toThrow(WebhookValidationError);
    expect(repository.createEndpoint).not.toHaveBeenCalled();
  });
});
