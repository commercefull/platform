import { createWebhookRepository, createWebhookEndpointProps } from '../../tests/testUtils';
import { ListWebhooksUseCase } from './ListWebhooks';

describe('ListWebhooksUseCase', () => {
  it('should list endpoints with default pagination when no filters are given', async () => {
    const repository = createWebhookRepository();
    repository.findEndpoints.mockResolvedValue({
      data: [createWebhookEndpointProps(), createWebhookEndpointProps({ webhookEndpointId: 'wh-2', isActive: false })],
      total: 2,
    });

    const result = await new ListWebhooksUseCase(repository).execute();

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(repository.findEndpoints).toHaveBeenCalledWith(undefined, { limit: 50, offset: 0 });
  });

  it('should pass filters and pagination through when provided', async () => {
    const repository = createWebhookRepository();

    await new ListWebhooksUseCase(repository).execute({ organizationId: 'org-1' }, 10, 5);

    expect(repository.findEndpoints).toHaveBeenCalledWith({ organizationId: 'org-1' }, { limit: 10, offset: 5 });
  });
});
