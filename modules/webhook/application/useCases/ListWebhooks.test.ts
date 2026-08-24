import { ListWebhooksUseCase } from './ListWebhooks';

describe('ListWebhooksUseCase', () => {
  let useCase: ListWebhooksUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findEndpoints: jest.fn().mockResolvedValue([
        { webhookEndpointId: 'wh-1', name: 'Hook1', url: 'https://a.com', events: ['*'], isActive: true },
        { webhookEndpointId: 'wh-2', name: 'Hook2', url: 'https://b.com', events: ['product.*'], isActive: false },
      ]),
    };
    useCase = new ListWebhooksUseCase(mockRepo as never);
  });

  it('should list webhooks with default pagination', async () => {
    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(mockRepo.findEndpoints).toHaveBeenCalledWith(undefined, { limit: 50, offset: 0 });
  });

  it('should pass filters and pagination to repository', async () => {
    await useCase.execute({ organizationId: 'org-1' }, 10, 5);

    expect(mockRepo.findEndpoints).toHaveBeenCalledWith({ organizationId: 'org-1' }, { limit: 10, offset: 5 });
  });
});
