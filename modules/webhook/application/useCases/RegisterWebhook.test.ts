jest.mock('../../../../libs/uuid', () => ({
  __esModule: true,
  generateUUID: jest.fn().mockReturnValue('uuid-mock'),
}));

import { RegisterWebhookUseCase, RegisterWebhookInput } from './RegisterWebhook';
import { WebhookValidationError } from '../../domain/errors/WebhookErrors';

describe('RegisterWebhookUseCase', () => {
  let useCase: RegisterWebhookUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      createEndpoint: jest.fn().mockResolvedValue({
        webhookEndpointId: 'wh-1', name: 'Test', url: 'https://example.com/hook',
        secret: 'secret-123', events: ['product.created'], isActive: true,
        headers: {}, retryPolicy: {},
      }),
    };
    useCase = new RegisterWebhookUseCase(mockRepo as never);
  });

  it('should register a webhook successfully', async () => {
    const input: RegisterWebhookInput = {
      name: 'Test', url: 'https://example.com/hook', events: ['product.created'],
    };

    const result = await useCase.execute(input);

    expect(result.webhookEndpointId).toBe('wh-1');
    expect(result.secret).toBeTruthy();
    expect(result.endpoint).toBeDefined();
    expect(mockRepo.createEndpoint).toHaveBeenCalled();
  });

  it('should throw WebhookValidationError for invalid URL', async () => {
    await expect(useCase.execute({ name: 'T', url: 'ftp://bad', events: ['e'] })).rejects.toThrow(WebhookValidationError);
  });

  it('should throw WebhookValidationError when no events specified', async () => {
    await expect(useCase.execute({ name: 'T', url: 'https://ok.com', events: [] })).rejects.toThrow(WebhookValidationError);
  });

  it('should throw WebhookValidationError when name missing', async () => {
    await expect(useCase.execute({ name: '', url: 'https://ok.com', events: ['e'] })).rejects.toThrow(WebhookValidationError);
  });
});
