import { createNotificationWebhook, createNotificationWebhookRepository } from '../../tests/testUtils';
import { ManageNotificationWebhooksAdminUseCase } from './ManageNotificationWebhooksAdmin';

describe('ManageNotificationWebhooksAdminUseCase', () => {
  let useCase: ManageNotificationWebhooksAdminUseCase;
  let webhookRepo: ReturnType<typeof createNotificationWebhookRepository>;

  beforeEach(() => {
    webhookRepo = createNotificationWebhookRepository();
    useCase = new ManageNotificationWebhooksAdminUseCase(webhookRepo);
  });

  it('should return all webhooks', async () => {
    const webhooks = [createNotificationWebhook()];
    webhookRepo.findAll.mockResolvedValue(webhooks);

    expect(await useCase.findAll()).toEqual(webhooks);
  });

  it('should create a webhook through the repository', async () => {
    const webhook = createNotificationWebhook({ notificationWebhookId: 'wh-2' });
    webhookRepo.create.mockResolvedValue(webhook);
    const params = { url: 'https://example.com', events: ['order.created'], isActive: true };

    const result = await useCase.create(params);

    expect(result).toEqual(webhook);
    expect(webhookRepo.create).toHaveBeenCalledWith(params);
  });

  it('should deactivate a webhook through the repository', async () => {
    await useCase.deactivate('wh-1');

    expect(webhookRepo.deactivate).toHaveBeenCalledWith('wh-1');
  });
});
