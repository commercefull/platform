jest.mock('../../infrastructure/repositories/NotificationConfigRepository', () => ({
  __esModule: true,
  default: {
    webhooks: {
      create: jest.fn().mockResolvedValue({
        notificationWebhookId: 'w1', organizationId: 'org1', url: 'https://example.com/webhook',
        events: ['order.created'], isActive: true, createdAt: new Date(), updatedAt: new Date(),
      }),
      deactivate: jest.fn().mockResolvedValue(true),
      findByMerchant: jest.fn().mockResolvedValue([
        { notificationWebhookId: 'w1', organizationId: 'org1', url: 'https://example.com/webhook',
          events: ['order.created'], isActive: true, createdAt: new Date(), updatedAt: new Date() },
      ]),
    },
    templates: {},
    preferences: {},
    devices: {},
    templateTranslations: {},
  },
}));

import { ManageNotificationWebhookUseCase, ManageNotificationWebhookCommand } from './ManageNotificationWebhook';

describe('ManageNotificationWebhookUseCase', () => {
  let useCase: ManageNotificationWebhookUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageNotificationWebhookUseCase();
  });

  it('should create webhook (happy path)', async () => {
    const result = await useCase.execute(new ManageNotificationWebhookCommand(
      'create', 'org1', undefined, 'https://example.com/webhook', 'secret', ['order.created'], true,
    ));

    expect(result.success).toBe(true);
    expect(result.webhook?.notificationWebhookId).toBe('w1');
  });

  it('should return error when url is missing', async () => {
    const result = await useCase.execute(new ManageNotificationWebhookCommand(
      'create', 'org1', undefined, undefined, undefined, ['order.created'],
    ));

    expect(result.success).toBe(false);
    expect(result.error).toBe('url is required');
  });

  it('should return error when events are missing', async () => {
    const result = await useCase.execute(new ManageNotificationWebhookCommand(
      'create', 'org1', undefined, 'https://example.com/webhook', undefined, [],
    ));

    expect(result.success).toBe(false);
    expect(result.error).toBe('events are required');
  });

  it('should list webhooks', async () => {
    const result = await useCase.execute(new ManageNotificationWebhookCommand('list', 'org1'));

    expect(result.success).toBe(true);
    expect(result.webhooks).toHaveLength(1);
  });

  it('should deactivate webhook', async () => {
    const result = await useCase.execute(new ManageNotificationWebhookCommand(
      'deactivate', 'org1', 'w1',
    ));

    expect(result.success).toBe(true);
  });
});
