import { UnregisterWebhookUseCase } from './UnregisterWebhook';
import { WebhookValidationError, WebhookEndpointNotFoundError } from '../../domain/errors/WebhookErrors';

describe('UnregisterWebhookUseCase', () => {
  let useCase: UnregisterWebhookUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findEndpointById: jest.fn().mockResolvedValue({ webhookEndpointId: 'wh-1' }),
      deleteEndpoint: jest.fn().mockResolvedValue(true),
    };
    useCase = new UnregisterWebhookUseCase(mockRepo as never);
  });

  it('should unregister a webhook successfully', async () => {
    const result = await useCase.execute('wh-1');

    expect(result).toBe(true);
    expect(mockRepo.deleteEndpoint).toHaveBeenCalledWith('wh-1');
  });

  it('should throw WebhookValidationError when id is empty', async () => {
    await expect(useCase.execute('')).rejects.toThrow(WebhookValidationError);
  });

  it('should throw WebhookEndpointNotFoundError when endpoint not found', async () => {
    mockRepo.findEndpointById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toThrow(WebhookEndpointNotFoundError);
  });
});
