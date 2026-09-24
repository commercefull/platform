import { createNotificationWebhook, createNotificationWebhookRepository } from '../../tests/testUtils';
import { ManageNotificationWebhookUseCase, ManageNotificationWebhookCommand } from './ManageNotificationWebhook';

describe('ManageNotificationWebhookUseCase', () => {
  let useCase: ManageNotificationWebhookUseCase;
  let webhookRepo: ReturnType<typeof createNotificationWebhookRepository>;

  beforeEach(() => {
    webhookRepo = createNotificationWebhookRepository();
    useCase = new ManageNotificationWebhookUseCase(webhookRepo);
  });

  it('should create a webhook and return the mapped record when url and events are provided', async () => {
    webhookRepo.create.mockResolvedValue(createNotificationWebhook());

    const result = await useCase.execute(
      new ManageNotificationWebhookCommand('create', 'org-1', undefined, 'https://example.com/hook', 'sec', ['order.created']),
    );

    expect(result.success).toBe(true);
    expect(result.webhook?.notificationWebhookId).toBe('wh-1');
    expect(result.webhook?.url).toBe('https://example.com/hook');
    expect(webhookRepo.create).toHaveBeenCalledWith({
      organizationId: 'org-1',
      url: 'https://example.com/hook',
      secret: 'sec',
      events: ['order.created'],
      isActive: true,
    });
  });

  it('should return an error when create is missing a url', async () => {
    const result = await useCase.execute(new ManageNotificationWebhookCommand('create', 'org-1', undefined, undefined, undefined, ['e']));

    expect(result).toEqual({ success: false, error: 'url is required' });
    expect(webhookRepo.create).not.toHaveBeenCalled();
  });

  it('should return an error when create has no events', async () => {
    const result = await useCase.execute(
      new ManageNotificationWebhookCommand('create', 'org-1', undefined, 'https://x.com', undefined, []),
    );

    expect(result).toEqual({ success: false, error: 'events are required' });
  });

  it('should return an error when create fails in the repository', async () => {
    webhookRepo.create.mockResolvedValue(null);

    const result = await useCase.execute(
      new ManageNotificationWebhookCommand('create', 'org-1', undefined, 'https://x.com', undefined, ['e']),
    );

    expect(result).toEqual({ success: false, error: 'Failed to create webhook' });
  });

  it('should deactivate a webhook when deactivate has an id', async () => {
    const result = await useCase.execute(new ManageNotificationWebhookCommand('deactivate', undefined, 'wh-1'));

    expect(result).toEqual({ success: true });
    expect(webhookRepo.deactivate).toHaveBeenCalledWith('wh-1');
  });

  it('should return an error when deactivate is missing the webhook id', async () => {
    const result = await useCase.execute(new ManageNotificationWebhookCommand('deactivate'));

    expect(result).toEqual({ success: false, error: 'notificationWebhookId is required' });
    expect(webhookRepo.deactivate).not.toHaveBeenCalled();
  });

  it('should list mapped webhooks for an organization', async () => {
    webhookRepo.findByMerchant.mockResolvedValue([createNotificationWebhook()]);

    const result = await useCase.execute(new ManageNotificationWebhookCommand('list', 'org-1'));

    expect(result.success).toBe(true);
    expect(result.webhooks).toHaveLength(1);
    expect(result.webhooks?.[0].organizationId).toBe('org-1');
    expect(webhookRepo.findByMerchant).toHaveBeenCalledWith('org-1');
  });

  it('should return an error when list is missing organizationId', async () => {
    const result = await useCase.execute(new ManageNotificationWebhookCommand('list'));

    expect(result).toEqual({ success: false, error: 'organizationId is required' });
  });
});
