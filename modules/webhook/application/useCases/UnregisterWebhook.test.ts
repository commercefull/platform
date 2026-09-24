import { createWebhookRepository } from '../../tests/testUtils';
import { UnregisterWebhookUseCase } from './UnregisterWebhook';
import { WebhookValidationError, WebhookEndpointNotFoundError } from '../../domain/errors/WebhookErrors';

describe('UnregisterWebhookUseCase', () => {
  it('should delete the endpoint when it exists', async () => {
    const repository = createWebhookRepository();

    const result = await new UnregisterWebhookUseCase(repository).execute('wh-1');

    expect(result).toBe(true);
    expect(repository.deleteEndpoint).toHaveBeenCalledWith('wh-1');
  });

  it('should throw WebhookValidationError when the id is empty', async () => {
    const repository = createWebhookRepository();

    await expect(new UnregisterWebhookUseCase(repository).execute('')).rejects.toThrow(WebhookValidationError);
    expect(repository.findEndpointById).not.toHaveBeenCalled();
    expect(repository.deleteEndpoint).not.toHaveBeenCalled();
  });

  it('should throw WebhookEndpointNotFoundError when the endpoint does not exist', async () => {
    const repository = createWebhookRepository();
    repository.findEndpointById.mockResolvedValue(null);

    await expect(new UnregisterWebhookUseCase(repository).execute('missing')).rejects.toThrow(
      WebhookEndpointNotFoundError,
    );
    expect(repository.deleteEndpoint).not.toHaveBeenCalled();
  });
});
